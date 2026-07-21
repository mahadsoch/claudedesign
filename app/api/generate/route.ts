import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { templateCatalog, templateSpec, TEMPLATE_IDS } from "@/lib/ai/templateSchema";
import { validateDeck } from "@/lib/ai/validateDeck";
import { chooseTemplates, contentTypeMenu, type PlanBeat } from "@/lib/ai/selectTemplate";
import { getTemplate } from "@/components/templates/registry";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "claude-opus-4-8";

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

async function callText(
  client: Anthropic,
  system: string,
  user: string,
  maxTokens: number
): Promise<string> {
  const message = await client.messages.create({
    model: MODEL,
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
  client: Anthropic,
  brief: string,
  count: number
): Promise<{ title: string; beats: PlanBeat[] }> {
  const system = `You plan on-brand slide decks for the brand "Soch". You do NOT write slide content yet — you decide, for each slide, what it is ABOUT and which KIND of slide it is.

Return ONLY JSON: { "meta": { "title": string }, "slides": [ { "intent": string, "contentType": string } ] } with exactly ${count} slides.
- "intent": ≤110 chars — the single point or heading this slide makes.
- "contentType": exactly one id from the menu below, chosen to match the intent.

CONTENT TYPES:
${contentTypeMenu()}

Rules: open with a "cover" slide and close with "nextsteps" or "closing". Pick the most SPECIFIC content type for each beat (e.g. pricing, roadmap, team, results, comparison) rather than defaulting to generic lists. Vary the content types. For a proposal / executive-review brief a strong spine is: cover → agenda → context → problem → approach → features → impact → roadmap → pricing → team → nextsteps, adapted to the brief.

No prose, no markdown fences.`;

  const raw = extractJson(await callText(client, system, `Plan a ${count}-slide deck for this brief:\n\n${brief}`, 3000)) as {
    meta?: { title?: string };
    slides?: { intent?: unknown; contentType?: unknown }[];
  };
  const beats: PlanBeat[] = (Array.isArray(raw.slides) ? raw.slides : [])
    .map((s) => ({ intent: String(s?.intent ?? ""), contentType: String(s?.contentType ?? "") }))
    .slice(0, count);
  if (beats.length === 0) throw new Error("Empty plan");
  return { title: raw.meta?.title || "AI draft", beats };
}

// ── Phase 2: fill the fields for the templates chosen for each beat ───────────
async function fillDeck(
  client: Anthropic,
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
    await callText(client, system, `Fill in the deck content, staying true to this brief:\n\n${brief}`, 16000)
  ) as { slides?: { fields?: unknown }[] };
  const filled = Array.isArray(raw.slides) ? raw.slides : [];

  // Assemble a raw deck with server-fixed templates; validateDeck coerces
  // fields to each schema and fills any gaps from defaults.
  const slides = templateIds.map((template, i) => ({ template, fields: filled[i]?.fields ?? {} }));
  return validateDeck({ meta: { title }, slides }, title);
}

// ── Fallback: the original single-pass generation ────────────────────────────
async function singlePass(client: Anthropic, brief: string, count: number) {
  const system = `You generate on-brand slide decks for the brand "Soch" as structured JSON.

You may ONLY use these template ids: ${TEMPLATE_IDS.join(", ")}.
Every slide is { "template": <one of the ids>, "fields": { ... } } where fields match that template's schema exactly. Titles may contain ONE coral accent using [[double brackets]].

For each slide, decide what the content IS, then pick the template whose "when to use" line and tags match it — reach for the specific template (pricing-tiers, roadmap-phases, process-stages, team-grid, step-timeline…) rather than generic lists. Open with a title/cover, close with a call to action, and vary backgrounds.

=== BRAND CONTRACT (DESIGN.md) ===
${readDesignContract()}

=== TEMPLATE CATALOG ===
${templateCatalog()}

Return ONLY a JSON object: { "meta": { "title": string }, "slides": [ { "template": string, "fields": object } ] }. No prose, no fences.`;
  const raw = extractJson(await callText(client, system, `Create a ${count}-slide deck for this brief:\n\n${brief}`, 16000));
  return validateDeck(raw, "AI draft");
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "No ANTHROPIC_API_KEY set. Add it to .env.local to use AI generation." },
      { status: 400 }
    );
  }

  let brief: string;
  let slideCount: number | undefined;
  try {
    ({ brief, slideCount } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!brief || typeof brief !== "string") {
    return NextResponse.json({ error: "A 'brief' string is required." }, { status: 400 });
  }

  const count = Math.min(Math.max(Number(slideCount) || 8, 3), 20);
  const client = new Anthropic({ apiKey });

  try {
    // Plan → choose templates server-side → fill. Fall back to single-pass if
    // the planning phase fails to produce a usable outline.
    try {
      const { title, beats } = await planDeck(client, brief, count);
      const templateIds = chooseTemplates(beats).filter((id) => getTemplate(id));
      const deck = await fillDeck(client, brief, title, beats, templateIds);
      return NextResponse.json({ deck });
    } catch {
      const deck = await singlePass(client, brief, count);
      return NextResponse.json({ deck });
    }
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
