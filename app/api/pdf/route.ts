import { NextResponse } from "next/server";
import { chromium } from "playwright";
import type { Deck } from "@/lib/model/deck";
import { uid } from "@/lib/model/deck";
import { putJob, dropJob } from "@/lib/pdf/jobStore";
import { chromiumExecutablePath } from "@/lib/pdf/browser";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(req: Request) {
  let deck: Deck;
  try {
    ({ deck } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON" }, { status: 400 });
  }
  if (!deck?.slides?.length) {
    return NextResponse.json({ error: "empty deck" }, { status: 400 });
  }

  const token = uid("job");
  putJob(token, deck);

  // Same-origin URL for Playwright to load the /print page.
  const url = new URL(req.url);
  const origin = `${url.protocol}//${url.host}`;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      executablePath: chromiumExecutablePath(),
    });
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await page.goto(`${origin}/print?token=${token}`, { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForSelector("[data-print-ready]", { timeout: 30_000 });

    const pdf = await page.pdf({
      printBackground: true,
      width: "1920px",
      height: "1080px",
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: false,
    });

    await browser.close();
    browser = undefined;

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="deck.pdf"',
      },
    });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  } finally {
    if (browser) await browser.close().catch(() => {});
    dropJob(token);
  }
}
