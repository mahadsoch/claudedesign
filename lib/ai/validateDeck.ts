import type { Deck, Slide, FieldValue } from "@/lib/model/deck";
import { uid } from "@/lib/model/deck";
import { getTemplate } from "@/components/templates/registry";
import type { FieldDef } from "@/components/templates/types";

// Coerce arbitrary JSON (from the AI, or an imported file) into a valid Deck:
// keep only known templates + field keys, enforce maxLength / maxItems, fill
// missing fields from the template defaults. Brand safety by construction.

function coerceScalar(def: FieldDef, value: unknown, fallback: FieldValue): FieldValue {
  if (value == null) return fallback;
  let s = typeof value === "string" ? value : String(value);
  if (def.maxLength && s.length > def.maxLength) s = s.slice(0, def.maxLength);
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
  notes?: unknown;
}

export function validateDeck(raw: unknown, title = "Generated deck"): Deck {
  const now = new Date().toISOString();
  const r = (raw ?? {}) as { id?: string; meta?: { title?: string }; slides?: RawSlide[] };
  const rawSlides = Array.isArray(r.slides) ? r.slides : [];

  const slides: Slide[] = rawSlides
    .filter((s) => s.template && getTemplate(s.template))
    .map((s) => {
      const tpl = getTemplate(s.template!)!;
      // Honour a valid slide-level background override; otherwise fall back to
      // the template default. Keeps AI/imported per-slide backgrounds intact.
      const bg =
        s.background === "dark" || s.background === "cream" || s.background === "coral"
          ? s.background
          : tpl.background;
      const slide: Slide = {
        id: s.id || uid("sl"),
        template: s.template!,
        background: bg,
        fields: coerceFields(s.template!, s.fields),
      };
      // Preserve freeform elements if a valid array was supplied (import path).
      if (Array.isArray(s.elements)) slide.elements = s.elements as Slide["elements"];
      if (typeof s.notes === "string") slide.notes = s.notes;
      return slide;
    });

  if (slides.length === 0) {
    throw new Error("No valid slides — every slide must use a known template id.");
  }

  return {
    id: typeof r.id === "string" && r.id ? r.id : uid("deck"),
    schemaVersion: 1,
    brandId: "soch",
    meta: { title: r.meta?.title || title, createdAt: now, updatedAt: now },
    slides,
  };
}
