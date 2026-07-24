import type { Deck } from "@/lib/model/deck";
import { inlineDeckImages, triggerDownload, slug } from "@/lib/persistence/transfer";

/** Render a single slide to a PNG (via the same /print + Playwright pipeline as
 *  the PDF) and download it. Captured at 2× for crisp, retina-quality output. */
export async function exportSlidePng(deck: Deck, slideIndex: number): Promise<void> {
  const portable = await inlineDeckImages(deck);
  const res = await fetch("/api/png", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck: portable, slideIndex }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`PNG export failed: ${msg}`);
  }
  const blob = await res.blob();
  triggerDownload(blob, `${slug(deck.meta.title)}-slide-${slideIndex + 1}.png`);
}
