import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { templateCatalog, TEMPLATE_IDS } from "@/lib/ai/templateSchema";
import { validateDeck } from "@/lib/ai/validateDeck";
import { runClaudeCode, ClaudeCodeNotInstalledError } from "@/lib/ai/claudeCode";

export const runtime = "nodejs";
export const maxDuration = 120;

const MODEL = "claude-opus-4-8";

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

/** Build the shared system + user prompts. Both providers use these verbatim. */
function buildPrompt(brief: string, count: number): { system: string; user: string } {
  const system = `You generate on-brand slide decks for the brand "Soch" as structured JSON.

You may ONLY use these template ids: ${TEMPLATE_IDS.join(", ")}.
Every slide is { "template": <one of the ids>, "fields": { ... } } where fields match that template's schema exactly (use the field keys shown; omit or fill list items sensibly). Titles may contain ONE coral accent using [[double brackets]] around the highlighted words.

Follow the brand contract and background rhythm below. Open with a title-hero, close with a contact-cta, and vary backgrounds so heavy slides (dark/coral) don't repeat back-to-back unless intentional.

=== BRAND CONTRACT (DESIGN.md) ===
${readDesignContract()}

=== TEMPLATE CATALOG ===
${templateCatalog()}

Return ONLY a JSON object of the shape:
{ "meta": { "title": string }, "slides": [ { "template": string, "fields": object }, ... ] }
No prose, no markdown fences.`;

  const user = `Create a ${count}-slide deck for this brief:\n\n${brief}`;
  return { system, user };
}

/** Generate via the billed Anthropic API. Returns the model's text. */
async function generateViaApi(system: string, user: string): Promise<string> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const message = await client.messages.create({
    model: MODEL,
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: user }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text.");
  }
  return textBlock.text;
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
  const { system, user } = buildPrompt(brief, count);

  try {
    const text =
      provider === "claude-code"
        ? await runClaudeCode(system, user, { model: MODEL })
        : await generateViaApi(system, user);

    const raw = extractJson(text);
    const deck = validateDeck(raw, "AI draft");
    return NextResponse.json({ deck });
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
