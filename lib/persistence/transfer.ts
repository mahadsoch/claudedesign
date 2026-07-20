import type { Deck } from "@/lib/model/deck";
import { inlineImage } from "./imageStore";
import { validateDeck } from "@/lib/ai/validateDeck";

/** Deep-inline every image field ref to a data URL so the deck is portable. */
export async function inlineDeckImages(deck: Deck): Promise<Deck> {
  const slides = await Promise.all(
    deck.slides.map(async (sl) => {
      const fields = { ...sl.fields };
      for (const [k, v] of Object.entries(fields)) {
        if (typeof v === "string" && v.startsWith("blob:")) {
          fields[k] = (await inlineImage(v)) ?? "";
        }
      }
      return { ...sl, fields };
    })
  );
  return { ...deck, slides };
}

/** Download the deck as a self-contained JSON (images inlined). */
export async function exportDeckJson(deck: Deck) {
  const portable = await inlineDeckImages(deck);
  const blob = new Blob([JSON.stringify(portable, null, 2)], { type: "application/json" });
  triggerDownload(blob, `${slug(deck.meta.title)}.json`);
}

export function importDeckJson(file: File): Promise<Deck> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => {
      try {
        const parsed = JSON.parse(r.result as string);
        if (!parsed.slides || !Array.isArray(parsed.slides)) throw new Error("Not a deck file");
        // Coerce/harden against the current template schemas (keeps images + ids).
        res(validateDeck(parsed, parsed?.meta?.title || "Imported deck"));
      } catch (e) {
        rej(e);
      }
    };
    r.onerror = rej;
    r.readAsText(file);
  });
}

export function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function slug(s: string) {
  return (s || "deck").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "deck";
}
