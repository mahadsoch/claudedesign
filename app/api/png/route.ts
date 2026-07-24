import { NextResponse } from "next/server";
import { chromium } from "playwright";
import type { Deck } from "@/lib/model/deck";
import { uid, STAGE_W, STAGE_H } from "@/lib/model/deck";
import { putJob, dropJob } from "@/lib/pdf/jobStore";
import { chromiumExecutablePath } from "@/lib/pdf/browser";

export const runtime = "nodejs";
export const maxDuration = 120;

// Per-slide PNG export. Mirrors /api/pdf: stash the deck under a token, load the
// shared /print page in headless Chromium, wait for the ready marker, then
// screenshot one .print-slide at 2× instead of printing the whole deck to PDF.
export async function POST(req: Request) {
  let deck: Deck;
  let slideIndex: number;
  try {
    ({ deck, slideIndex } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!deck?.slides?.length) {
    return NextResponse.json({ error: "empty deck" }, { status: 400 });
  }
  const idx = Number.isInteger(slideIndex) ? slideIndex : 0;
  if (idx < 0 || idx >= deck.slides.length) {
    return NextResponse.json({ error: "slide index out of range" }, { status: 400 });
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
    const page = await browser.newPage({
      viewport: { width: STAGE_W, height: STAGE_H },
      deviceScaleFactor: 2,
    });
    await page.goto(`${origin}/print?token=${token}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForSelector("[data-print-ready]", { timeout: 30_000 });

    const target = page.locator(".print-slide").nth(idx);
    const png = await target.screenshot({ type: "png" });

    await browser.close();
    browser = undefined;

    return new NextResponse(new Uint8Array(png), {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="slide-${idx + 1}.png"`,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
    dropJob(token);
  }
}
