import type { Deck } from "@/lib/model/deck";
import { inlineImage } from "./imageStore";
import { validateDeck } from "@/lib/ai/validateDeck";

const isBlobRef = (v: unknown): v is string => typeof v === "string" && v.startsWith("blob:");

/** Deep-inline every image field ref to a data URL so the deck is portable. */
export async function inlineDeckImages(deck: Deck): Promise<Deck> {
  const slides = await Promise.all(
    deck.slides.map(async (sl) => {
      const fields = { ...sl.fields };
      for (const [k, v] of Object.entries(fields)) {
        if (isBlobRef(v)) {
          fields[k] = (await inlineImage(v)) ?? "";
        } else if (Array.isArray(v)) {
          // `list` fields hold rows of strings, and a row cell can be an image
          // ref too (feature-grid icons, logo-stack-grid logos, team-grid
          // photos). Without this the row image is lost on export and renders
          // as the empty ImageBox placeholder.
          fields[k] = (await Promise.all(
            v.map(async (row) => {
              if (typeof row !== "object" || row === null) return row;
              const out: Record<string, string> = { ...(row as Record<string, string>) };
              for (const [rk, rv] of Object.entries(out)) {
                if (isBlobRef(rv)) out[rk] = (await inlineImage(rv)) ?? "";
              }
              return out;
            })
          )) as typeof v;
        }
      }
      // Detached (freeform) slides carry image refs in elements[].content too.
      let elements = sl.elements;
      if (elements) {
        elements = await Promise.all(
          elements.map(async (el) =>
            el.type === "image" && isBlobRef(el.content)
              ? { ...el, content: (await inlineImage(el.content)) ?? "" }
              : el
          )
        );
      }
      return { ...sl, fields, ...(elements ? { elements } : {}) };
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
