import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { templateCatalog, TEMPLATE_IDS } from "@/lib/ai/templateSchema";
import { validateDeck } from "@/lib/ai/validateDeck";
import { generateWithClaudeCode, ClaudeCodeUnavailableError } from "@/lib/ai/claudeCode";

export const runtime = "nodejs";
export const maxDuration = 120;

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

// "anthropic-api" calls the Anthropic API directly with ANTHROPIC_API_KEY.
// "claude-code" shells out to a locally-installed `claude` CLI session instead
// — no API key needed in this app, it rides on whatever the CLI is already
// authenticated with. AI_PROVIDER picks one explicitly; otherwise we default
// to the API key if present, else fall back to the CLI.
function resolveProvider(): "anthropic-api" | "claude-code" {
  const explicit = process.env.AI_PROVIDER?.toLowerCase();
  if (explicit === "claude-code" || explicit === "anthropic-api") return explicit;
  return process.env.ANTHROPIC_API_KEY ? "anthropic-api" : "claude-code";
}

export async function POST(req: Request) {
  const provider = resolveProvider();
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (provider === "anthropic-api" && !apiKey) {
    return NextResponse.json(
      {
        error:
          "No ANTHROPIC_API_KEY set. Add it to .env.local, or set AI_PROVIDER=claude-code to use a local Claude Code CLI session instead.",
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

  const userMessage = `Create a ${count}-slide deck for this brief:\n\n${brief}`;

  try {
    const text =
      provider === "claude-code"
        ? await generateWithClaudeCode(`${system}\n\n${userMessage}`, {
            model: process.env.CLAUDE_CODE_MODEL,
          })
        : await callAnthropicApi(apiKey!, system, userMessage);

    const raw = extractJson(text);
    const deck = validateDeck(raw, "AI draft");
    return NextResponse.json({ deck });
  } catch (e) {
    if (e instanceof ClaudeCodeUnavailableError) {
      return NextResponse.json(
        { error: `${e.message} Or set ANTHROPIC_API_KEY / AI_PROVIDER=anthropic-api to use the API instead.` },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

async function callAnthropicApi(apiKey: string, system: string, userMessage: string): Promise<string> {
  const client = new Anthropic({ apiKey });
  const message = await client.messages.create({
    model: "claude-opus-4-8",
    max_tokens: 16000,
    system,
    messages: [{ role: "user", content: userMessage }],
  });
  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    throw new Error("Model returned no text.");
  }
  return textBlock.text;
}
