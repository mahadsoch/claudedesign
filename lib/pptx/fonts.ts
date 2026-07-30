// Brand fonts for PPTX export.
//
// The deck uses three Google families at four weights each, loaded by
// `next/font` (which only emits .woff2). PPTX embedding needs TrueType, so the
// .ttf files live in `public/fonts/` — see README for how they got there.
//
// The constraint that shapes this file: **PPTX has no numeric font weights.**
// An embedded typeface has only regular / bold / italic / boldItalic slots, so
// "Poppins 500" and "Poppins 600" cannot both hang off the name "Poppins".
// The fix is to use each face's own legacy family name — "Poppins Medium",
// "Poppins SemiBold" — which is also the name Windows shows in the font menu,
// and to embed each as its own typeface. Weight 700 is the one case that can
// ride the bold slot of the base family.
//
// If a face's real name-table entry ever disagrees with the table below, fix it
// HERE and nowhere else.

export interface PptxFont {
  typeface: string;
  bold: boolean;
}

/** A face to embed in the .pptx. `slot` is the OOXML element it fills. */
export interface EmbedFace {
  /** Typeface name as referenced by runs — must match `pptxFont()` output. */
  typeface: string;
  /** File under `public/fonts/`. */
  file: string;
  slot: "regular" | "bold";
}

const BASE: Record<string, string> = {
  Poppins: "Poppins",
  "Open Sans": "OpenSans",
  "JetBrains Mono": "JetBrainsMono",
};

/** Snap an arbitrary CSS weight onto the four weights the deck actually ships. */
function snapWeight(w: number): 400 | 500 | 600 | 700 {
  if (w >= 700) return 700;
  if (w >= 600) return 600;
  if (w >= 500) return 500;
  return 400;
}

/**
 * Map a canonical family + CSS weight onto a PPTX typeface and bold flag.
 *
 * Never names a face we do not bundle: an unshipped weight degrades to the
 * closest one we do embed (600 → bold, 500 → regular) rather than leaving
 * PowerPoint to substitute a font of its own choosing.
 */
export function pptxFont(family: string, weight: number): PptxFont {
  const fam = BASE[family] ? family : "Open Sans";
  const shipped = (typeface: string) => SHIPPED_TYPEFACES.has(typeface);
  switch (snapWeight(weight)) {
    case 500:
      return shipped(fam + " Medium") ? { typeface: fam + " Medium", bold: false } : { typeface: fam, bold: false };
    case 600:
      return shipped(fam + " SemiBold") ? { typeface: fam + " SemiBold", bold: false } : { typeface: fam, bold: true };
    case 700:
      return { typeface: fam, bold: true };
    default:
      return { typeface: fam, bold: false };
  }
}

/**
 * Every face worth embedding, in the order the deck uses them. Missing files
 * are skipped with a warning rather than failing the export — a deck without
 * embedded fonts is still a correct deck.
 */
export const EMBED_FACES: EmbedFace[] = [
  { typeface: "Poppins", file: "Poppins-Regular.ttf", slot: "regular" },
  { typeface: "Poppins", file: "Poppins-Bold.ttf", slot: "bold" },
  { typeface: "Poppins Medium", file: "Poppins-Medium.ttf", slot: "regular" },
  { typeface: "Poppins SemiBold", file: "Poppins-SemiBold.ttf", slot: "regular" },
  { typeface: "Open Sans", file: "OpenSans-Regular.ttf", slot: "regular" },
  { typeface: "Open Sans", file: "OpenSans-Bold.ttf", slot: "bold" },
  { typeface: "Open Sans SemiBold", file: "OpenSans-SemiBold.ttf", slot: "regular" },
  { typeface: "JetBrains Mono", file: "JetBrainsMono-Regular.ttf", slot: "regular" },
  { typeface: "JetBrains Mono", file: "JetBrainsMono-Bold.ttf", slot: "bold" },
  { typeface: "JetBrains Mono Medium", file: "JetBrainsMono-Medium.ttf", slot: "regular" },
];

/** Typeface names we actually ship a file for — see `pptxFont` fallbacks. */
const SHIPPED_TYPEFACES = new Set(EMBED_FACES.map((f) => f.typeface));

/** Theme defaults, so a recipient's new text box starts on-brand. */
export const THEME_HEAD = "Poppins SemiBold";
export const THEME_BODY = "Open Sans";
