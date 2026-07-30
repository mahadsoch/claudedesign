import { NextResponse } from "next/server";
import path from "node:path";
import { chromium } from "playwright";
import type { Deck } from "@/lib/model/deck";
import { STAGE_H, STAGE_W, uid } from "@/lib/model/deck";
import { putJob, dropJob } from "@/lib/pdf/jobStore";
import { chromiumExecutablePath } from "@/lib/pdf/browser";
import { extractDeckIR } from "@/lib/pptx/domExtract";
import { buildPptx, buildPptxFromImages } from "@/lib/pptx/buildPptx";
import { embedFonts } from "@/lib/pptx/embedFonts";

export const runtime = "nodejs";
export const maxDuration = 120;

const PPTX_MIME = "application/vnd.openxmlformats-officedocument.presentationml.presentation";

/**
 * Export the deck as an editable .pptx.
 *
 * Mirrors /api/pdf: the deck goes into the in-memory job store under a token,
 * headless Chromium loads /print?token=…, and we wait for the same
 * [data-print-ready] marker. Instead of printing, we run the DOM extractor in
 * the page to measure the rendered layout, then emit native PowerPoint objects.
 *
 * Body: { deck, flatten?, debug? }
 *  - debug   → return the intermediate representation as JSON (no file)
 *  - flatten → screenshot each slide instead; a perfect but non-editable deck
 */
export async function POST(req: Request) {
  let deck: Deck;
  let flatten = false;
  let debug = false;
  try {
    const body = await req.json();
    deck = body.deck;
    flatten = !!body.flatten;
    debug = !!body.debug;
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!deck?.slides?.length) {
    return NextResponse.json({ error: "empty deck" }, { status: 400 });
  }

  const token = uid("job");
  putJob(token, deck);

  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: chromiumExecutablePath(),
    });
    const context = await browser.newContext({
      viewport: { width: STAGE_W, height: STAGE_H },
      // Only the flatten path needs the extra pixels; measuring does not.
      deviceScaleFactor: flatten ? 2 : 1,
    });
    const page = await context.newPage();
    await page.goto(`${origin}/print?token=${token}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForSelector("[data-print-ready]", { timeout: 30_000 });

    const title = deck.meta?.title || "Deck";

    if (flatten) {
      const slides = page.locator(".print-slide");
      const count = await slides.count();
      const images: string[] = [];
      for (let i = 0; i < count; i++) {
        const shot = await slides.nth(i).screenshot({ type: "png" });
        images.push("data:image/png;base64," + shot.toString("base64"));
      }
      const buf = await buildPptxFromImages(images, { title });
      await browser.close();
      browser = undefined;
      return pptxResponse(buf);
    }

    // The extractor runs inside the page — see the warning in domExtract.ts
    // about it having to be self-contained.
    const ir = await page.evaluate(extractDeckIR);
    await browser.close();
    browser = undefined;

    for (const w of ir.warnings) console.warn("[pptx] " + w);

    if (debug) {
      return NextResponse.json({
        slideCount: ir.slides.length,
        warnings: ir.warnings,
        // Image payloads are megabytes of base64 and useless when eyeballing
        // geometry, so summarise them instead.
        slides: ir.slides.map((s) => ({
          ...s,
          marks: s.marks.map((m) =>
            m.kind === "image" ? { ...m, data: `«${m.data.length} bytes»` } : m
          ),
        })),
      });
    }

    const built = await buildPptx(ir.slides, { title });
    const { buffer, embedded, warnings } = await embedFonts(built, path.join(process.cwd(), "public", "fonts"));
    for (const w of warnings) console.warn("[pptx] " + w);
    if (embedded.length) console.log(`[pptx] embedded ${embedded.length} font faces`);

    return pptxResponse(buffer);
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
    dropJob(token);
  }
}

function pptxResponse(buf: Buffer) {
  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": PPTX_MIME,
      "Content-Disposition": 'attachment; filename="deck.pptx"',
    },
  });
}
