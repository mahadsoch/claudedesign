import type { Deck } from "@/lib/model/deck";
import { inlineDeckImages } from "@/lib/persistence/transfer";
import { triggerDownload, slug } from "@/lib/persistence/transfer";

/** Send the deck (images inlined) to the server PDF route and download the result. */
export async function exportDeckPdf(deck: Deck): Promise<void> {
  const portable = await inlineDeckImages(deck);
  const res = await fetch("/api/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ deck: portable }),
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`PDF export failed: ${msg}`);
  }
  const blob = await res.blob();
  triggerDownload(blob, `${slug(deck.meta.title)}.pdf`);
}
