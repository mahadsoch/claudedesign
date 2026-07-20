import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Anthropic from "@anthropic-ai/sdk";
import { templateCatalog, TEMPLATE_IDS } from "@/lib/ai/templateSchema";
import { validateDeck } from "@/lib/ai/validateDeck";

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

  const client = new Anthropic({ apiKey });

  try {
    const message = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      system,
      messages: [
        {
          role: "user",
          content: `Create a ${count}-slide deck for this brief:\n\n${brief}`,
        },
      ],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json({ error: "Model returned no text." }, { status: 502 });
    }

    const raw = extractJson(textBlock.text);
    const deck = validateDeck(raw, "AI draft");
    return NextResponse.json({ deck });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
