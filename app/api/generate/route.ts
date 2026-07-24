import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { templateCatalog, templateSpec, TEMPLATE_IDS } from "@/lib/ai/templateSchema";
import { validateDeck } from "@/lib/ai/validateDeck";
import { runClaudeCode, ClaudeCodeNotInstalledError } from "@/lib/ai/claudeCode";
import { chooseTemplates, contentTypeMenu, type PlanBeat } from "@/lib/ai/selectTemplate";
import { getTemplate } from "@/components/templates/registry";

export const runtime = "nodejs";
export const maxDuration = 120;

// Planning / template-selection uses the stronger model for structural
// reasoning; the actual slide copy is written by Sonnet.
const MODEL = "claude-opus-4-8";
const CONTENT_MODEL = "claude-sonnet-5";

type Provider = "api" | "claude-code";

/**
 * Which AI backend to use. `DECK_AI_PROVIDER` (api | claude-code) forces one;
 * otherwise auto: an API key uses the billed API, else the Claude Code CLI
 * (subscription login).
 */
function resolveProvider(): Provider {
  const forced = process.env.DECK_AI_PROVIDER?.trim().toLowerCase();
  if (forced === "api" || forced === "claude-code") return forced;
  return process.env.ANTHROPIC_API_KEY ? "api" : "claude-code";
}

function readDesignContract(): string {
  try {
    return fs.readFileSync(path.join(process.cwd(), "DESIGN.md"), "utf8");
  } catch {
    return "";
  }
}

function extractJson(text: string): unknown {
  // Strip ```json fences if present, then take the outermost {...}.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object in model response");
  return JSON.parse(body.slice(start, end + 1));
}

/** Run one prompt through the active provider (billed API or Claude Code CLI). */
async function callModel(
  provider: Provider,
  system: string,
  user: string,
  maxTokens: number,
  model: string = MODEL
): Promise<string> {
  if (provider === "claude-code") {
    return runClaudeCode(system, user, { model });
  }
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = message.content.find((b) => b.type === "text");
  if (!block || block.type !== "text") throw new Error("Model returned no text.");
  return block.text;
}

// ── Phase 1: plan the deck as intent + content-type beats ────────────────────
async function planDeck(
  provider: Provider,
  brief: string,
  count: number,
  append = false
): Promise<{ title: string; beats: PlanBeat[] }> {
  // Append mode extends an existing deck, so it produces only body/content beats
  // — no cover or closing, which the deck already has.
  const spine = append
    ? `Rules: these slides EXTEND an existing deck, so do NOT include a cover, agenda, or closing/next-steps slide — produce only substantive body beats about the brief. Pick the most SPECIFIC content type for each beat and vary them.`
    : `Rules: open with a "cover" slide and close with "nextsteps" or "closing". Pick the most SPECIFIC content type for each beat (e.g. pricing, roadmap, team, results, comparison) rather than defaulting to generic lists. Vary the content types. For a proposal / executive-review brief a strong spine is: cover → agenda → context → problem → approach → features → impact → roadmap → pricing → team → nextsteps, adapted to the brief.`;

  const system = `You plan on-brand slide decks for the brand "Soch". You do NOT write slide content yet — you decide, for each slide, what it is ABOUT and which KIND of slide it is.

Return ONLY JSON: { "meta": { "title": string }, "slides": [ { "intent": string, "contentType": string } ] } with exactly ${count} slides.
- "intent": ≤110 chars — the single point or heading this slide makes.
- "contentType": exactly one id from the menu below, chosen to match the intent.

CONTENT TYPES:
${contentTypeMenu()}

${spine}

No prose, no markdown fences.`;

  const raw = extractJson(
    await callModel(provider, system, `Plan a ${count}-slide deck for this brief:\n\n${brief}`, 3000)
  ) as { meta?: { title?: string }; slides?: { intent?: unknown; contentType?: unknown }[] };
  const beats: PlanBeat[] = (Array.isArray(raw.slides) ? raw.slides : [])
    .map((s) => ({ intent: String(s?.intent ?? ""), contentType: String(s?.contentType ?? "") }))
    .slice(0, count);
  if (beats.length === 0) throw new Error("Empty plan");
  return { title: raw.meta?.title || "AI draft", beats };
}

// ── Phase 2: fill the fields for the templates chosen for each beat ───────────
async function fillDeck(
  provider: Provider,
  brief: string,
  title: string,
  beats: PlanBeat[],
  templateIds: string[]
) {
  const slideSpecs = templateIds
    .map((id, i) => `SLIDE ${i + 1} — template "${id}"\nintent: ${beats[i].intent}\n${templateSpec(id)}`)
    .join("\n\n");

  const system = `You write the content for an on-brand slide deck for the brand "Soch". The template for each slide is ALREADY CHOSEN and fixed — do not change it. Fill each slide's fields to match its schema exactly (use the exact field keys; fill list items sensibly and within the item caps). Titles may contain ONE coral accent using [[double brackets]]. Write in the Soch voice: practical, direct, confident, short declarative sentences, no hype.

Return ONLY JSON: { "slides": [ { "fields": { ... } } ] } with exactly ${beats.length} entries, in the SAME order as the slides below. No "template" key, no prose, no markdown fences.

=== BRAND CONTRACT (DESIGN.md) ===
${readDesignContract()}

=== SLIDES TO FILL (in order) ===
${slideSpecs}`;

  const raw = extractJson(
    await callModel(provider, system, `Fill in the deck content, staying true to this brief:\n\n${brief}`, 16000, CONTENT_MODEL)
  ) as { slides?: { fields?: unknown }[] };
  const filled = Array.isArray(raw.slides) ? raw.slides : [];

  // Assemble a raw deck with server-fixed templates; validateDeck coerces
  // fields to each schema and fills any gaps from defaults.
  const slides = templateIds.map((template, i) => ({ template, fields: filled[i]?.fields ?? {} }));
  return validateDeck({ meta: { title }, slides }, title);
}

// ── Fallback: single-pass generation (model picks templates + fills at once) ──
async function singlePass(provider: Provider, brief: string, count: number) {
  const system = `You generate on-brand slide decks for the brand "Soch" as structured JSON.

You may ONLY use these template ids: ${TEMPLATE_IDS.join(", ")}.
Every slide is { "template": <one of the ids>, "fields": { ... } } where fields match that template's schema exactly. Titles may contain ONE coral accent using [[double brackets]].

For each slide, decide what the content IS, then pick the template whose "when to use" line and tags match it — reach for the specific template (pricing-tiers, roadmap-phases, process-stages, team-grid, step-timeline…) rather than generic lists. Open with a title/cover, close with a call to action, and vary backgrounds.

=== BRAND CONTRACT (DESIGN.md) ===
${readDesignContract()}

=== TEMPLATE CATALOG ===
${templateCatalog()}

Return ONLY a JSON object: { "meta": { "title": string }, "slides": [ { "template": string, "fields": object } ] }. No prose, no fences.`;
  const raw = extractJson(
    await callModel(provider, system, `Create a ${count}-slide deck for this brief:\n\n${brief}`, 16000, CONTENT_MODEL)
  );
  return validateDeck(raw, "AI draft");
}

// ── Per-slide rewrite: fill ONE fixed template's fields per an instruction ────
async function regenerateSlideFields(
  provider: Provider,
  template: string,
  instruction: string,
  deckTitle: string,
  currentFields: unknown
): Promise<Record<string, unknown>> {
  const system = `You rewrite the content of a SINGLE on-brand slide for the brand "Soch". The template is fixed: "${template}". Fill its fields to match the schema exactly (exact field keys, respect item caps and lengths). Titles may contain ONE coral accent using [[double brackets]]. Soch voice: practical, direct, confident, short declarative sentences, no hype.

Return ONLY JSON: { "fields": { ... } }. No "template" key, no prose, no markdown fences.

=== BRAND CONTRACT (DESIGN.md) ===
${readDesignContract()}

=== TEMPLATE SCHEMA ===
${templateSpec(template)}

=== CURRENT CONTENT (revise this) ===
${JSON.stringify(currentFields ?? {})}`;

  const user = `Deck title: ${deckTitle}\n\nRewrite this slide following this instruction:\n${instruction}`;
  const raw = extractJson(await callModel(provider, system, user, 4000, CONTENT_MODEL)) as {
    fields?: Record<string, unknown>;
  };
  // Coerce through validateDeck (one-slide deck) so the fields are schema-safe.
  const deck = validateDeck({ meta: { title: deckTitle }, slides: [{ template, fields: raw.fields ?? {} }] });
  return deck.slides[0].fields as Record<string, unknown>;
}

export async function POST(req: Request) {
  const provider = resolveProvider();
  if (provider === "api" && !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      {
        error:
          "No ANTHROPIC_API_KEY set. Add it to .env.local, or install and log in to Claude Code (`claude login`) to generate with your subscription instead.",
      },
      { status: 400 }
    );
  }

  let body: {
    action?: string;
    brief?: string;
    slideCount?: number;
    append?: boolean;
    title?: string;
    beats?: PlanBeat[];
    templateIds?: string[];
    template?: string;
    instruction?: string;
    deckTitle?: string;
    currentFields?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }

  const action = body.action ?? "full";
  const count = Math.min(Math.max(Number(body.slideCount) || 8, 3), 20);

  try {
    // ── Per-slide rewrite ──────────────────────────────────────────────────
    if (action === "slide") {
      if (!body.template || !getTemplate(body.template)) {
        return NextResponse.json({ error: "A valid 'template' is required." }, { status: 400 });
      }
      if (!body.instruction || typeof body.instruction !== "string") {
        return NextResponse.json({ error: "An 'instruction' is required." }, { status: 400 });
      }
      const fields = await regenerateSlideFields(
        provider,
        body.template,
        body.instruction,
        body.deckTitle || "Deck",
        body.currentFields
      );
      return NextResponse.json({ fields });
    }

    // ── Phase 1 only: return the plan + chosen templates (for staged UI) ─────
    if (action === "plan") {
      if (!body.brief) return NextResponse.json({ error: "A 'brief' string is required." }, { status: 400 });
      const { title, beats } = await planDeck(provider, body.brief, count, !!body.append);
      const templateIds = chooseTemplates(beats).filter((id) => getTemplate(id));
      return NextResponse.json({ title, beats, templateIds });
    }

    // ── Phase 2 only: fill fields for a plan the client already has ──────────
    if (action === "fill") {
      if (!body.brief || !Array.isArray(body.beats) || !Array.isArray(body.templateIds)) {
        return NextResponse.json({ error: "'brief', 'beats' and 'templateIds' are required." }, { status: 400 });
      }
      const ids = body.templateIds.filter((id) => getTemplate(id));
      const deck = await fillDeck(provider, body.brief, body.title || "AI draft", body.beats, ids);
      return NextResponse.json({ deck });
    }

    // ── Full one-shot (fallback for clients that don't stage) ────────────────
    if (!body.brief || typeof body.brief !== "string") {
      return NextResponse.json({ error: "A 'brief' string is required." }, { status: 400 });
    }
    try {
      const { title, beats } = await planDeck(provider, body.brief, count, !!body.append);
      const templateIds = chooseTemplates(beats).filter((id) => getTemplate(id));
      const deck = await fillDeck(provider, body.brief, title, beats, templateIds);
      return NextResponse.json({ deck });
    } catch (planErr) {
      if (planErr instanceof ClaudeCodeNotInstalledError) throw planErr;
      const deck = await singlePass(provider, body.brief, count);
      return NextResponse.json({ deck });
    }
  } catch (e) {
    if (e instanceof ClaudeCodeNotInstalledError) {
      return NextResponse.json(
        {
          error:
            "Claude Code isn't installed or you're not logged in. Run `claude login`, or set ANTHROPIC_API_KEY in .env.local to use the API instead.",
        },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
