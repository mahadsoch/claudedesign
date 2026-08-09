import type { Deck, Slide, FieldValue, Background } from "@/lib/model/deck";
import { uid } from "@/lib/model/deck";

const BACKGROUNDS: Background[] = ["dark", "cream", "coral"];
import { getTemplate } from "@/components/templates/registry";
import type { FieldDef } from "@/components/templates/types";

// Coerce arbitrary JSON (from the AI, or an imported file) into a valid Deck:
// keep only known templates + field keys, enforce maxLength / maxItems, fill
// missing fields from the template defaults. Brand safety by construction.

/**
 * Truncate to `max` characters on a word boundary, with an ellipsis. A hard
 * mid-word slice is worse than useless here: the deck ships to a client with a
 * visibly chopped word rather than a sentence that merely ends early.
 */
function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  const cut = s.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  const stem = (lastSpace > max * 0.6 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.–—-]+$/, "");
  return stem + "…";
}

function coerceScalar(def: FieldDef, value: unknown, fallback: FieldValue): FieldValue {
  if (value == null) return fallback;
  let s = typeof value === "string" ? value : String(value);
  // A `select` may only ever hold one of its declared options, so a template
  // can branch on the value without defensive parsing.
  if (def.type === "select") {
    const options = def.options ?? [];
    if (options.length === 0) return s;
    return options.some((o) => o.value === s) ? s : String(fallback || options[0].value);
  }
  if (def.maxLength && s.length > def.maxLength) s = truncate(s, def.maxLength);
  return s;
}

function coerceList(def: FieldDef, value: unknown, fallback: FieldValue): FieldValue {
  if (!Array.isArray(value)) return fallback;
  const itemDefs = def.itemFields ?? [];
  let items = value.map((raw) => {
    const row: Record<string, string> = {};
    for (const sub of itemDefs) {
      const v = (raw as Record<string, unknown>)?.[sub.key];
      row[sub.key] = String(coerceScalar(sub, v, ""));
    }
    return row;
  });
  if (def.maxItems) items = items.slice(0, def.maxItems);
  return items;
}

function coerceFields(templateId: string, raw: unknown): Record<string, FieldValue> {
  const tpl = getTemplate(templateId)!;
  const defaults = tpl.defaults();
  const input = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, FieldValue> = {};
  for (const def of tpl.fields) {
    const fallback = defaults[def.key] ?? (def.type === "list" ? [] : "");
    out[def.key] =
      def.type === "list"
        ? coerceList(def, input[def.key], fallback)
        : coerceScalar(def, input[def.key], fallback);
  }
  return out;
}

interface RawSlide {
  id?: string;
  template?: string;
  background?: string;
  fields?: unknown;
  elements?: unknown;
}

export function validateDeck(raw: unknown, title = "Generated deck"): Deck {
  const now = new Date().toISOString();
  const r = (raw ?? {}) as { meta?: { title?: string }; slides?: RawSlide[] };
  const rawSlides = Array.isArray(r.slides) ? r.slides : [];

  const slides: Slide[] = rawSlides
    .filter((s) => s.template && getTemplate(s.template))
    .map((s) => {
      const tpl = getTemplate(s.template!)!;
      // The slide owns its background; the template only supplies the default.
      // Honouring an explicit value here is what lets the generator (and an
      // imported deck) express DESIGN.md's background rhythm at all.
      const bg = BACKGROUNDS.includes(s.background as Background)
        ? (s.background as Background)
        : tpl.background;
      const slide: Slide = {
        id: s.id || uid("sl"),
        template: s.template!,
        background: bg,
        fields: coerceFields(s.template!, s.fields),
      };
      // Preserve freeform elements if a valid array was supplied (import path).
      if (Array.isArray(s.elements)) slide.elements = s.elements as Slide["elements"];
      return slide;
    });

  if (slides.length === 0) {
    throw new Error("No valid slides — every slide must use a known template id.");
  }

  return {
    schemaVersion: 1,
    brandId: "soch",
    meta: { title: r.meta?.title || title, createdAt: now, updatedAt: now },
    slides,
  };
}
