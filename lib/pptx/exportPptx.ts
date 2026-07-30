import type { Deck } from "@/lib/model/deck";
import { inlineDeckImages, triggerDownload, slug } from "@/lib/persistence/transfer";

export interface PptxExportOptions {
  /** Emit full-slide images instead of editable objects (the escape hatch). */
  flatten?: boolean;
}

/**
 * Send the deck (images inlined) to the server PPTX route and download the
 * result. Deliberately identical in shape to `exportDeckPdf` — both need the
 * deck to be self-contained before it crosses into headless Chromium, which has
 * no access to this browser's IndexedDB.
 */
export async function exportDeckPptx(deck: Deck, opts: PptxExportOptions = {}): Promise<void> {
  const portable = await inlineDeckImages(deck);
  const res = await fetch("/api/pptx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck: portable, flatten: !!opts.flatten }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`PPTX export failed: ${msg}`);
  }
  const blob = await res.blob();
  triggerDownload(blob, `${slug(deck.meta.title)}.pptx`);
}
