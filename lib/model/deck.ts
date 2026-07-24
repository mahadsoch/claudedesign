// ─────────────────────────────────────────────────────────────────────────
// Core data model. A deck is a list of slides; each slide is driven by a
// template + structured `fields`. Once "detached to canvas" (Phase 3) a slide
// also carries an explicit `elements` list for freeform editing. Templates and
// the freeform renderer both ultimately produce absolutely-positioned DOM on a
// fixed 1920×1080 stage — so the editor preview and the PDF are identical.
// ─────────────────────────────────────────────────────────────────────────

export const STAGE_W = 1920;
export const STAGE_H = 1080;

export type Background = "dark" | "cream" | "coral";

export type FieldValue = string | number | string[] | ListItemValue[];

/** A row in a `list` field (e.g. an agenda item or a stat). */
export type ListItemValue = Record<string, string>;

export interface Slide {
  id: string;
  template: string; // TemplateId (registry key)
  background: Background;
  fields: Record<string, FieldValue>;
  /** Freeform overrides — present only after a slide is detached to canvas. */
  elements?: SlideElement[];
  /** Presenter-only speaker notes. Never rendered on the slide or in the PDF. */
  notes?: string;
}

export interface DeckMeta {
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface Deck {
  /** Stable per-deck id — the IndexedDB key and the library identity. */
  id: string;
  schemaVersion: 1;
  brandId: string;
  meta: DeckMeta;
  slides: Slide[];
}

// ── Freeform element model (Phase 3) ──────────────────────────────────────

export type ElementType = "text" | "image" | "shape";

export interface SlideElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation: number;
  /** Inline style overrides (brand-token values preferred). */
  style: Record<string, string | number>;
  /** Text content (text), image ref key (image), or empty (shape). */
  content?: string;
  /** Links this element back to a template field for two-way editing. */
  fieldKey?: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

let _counter = 0;
/** Small deterministic-ish id generator (crypto when available). */
export function uid(prefix = "el"): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
  }
  _counter += 1;
  return `${prefix}_${Date.now().toString(36)}${_counter}`;
}

export function emptyDeck(title = "Untitled deck"): Deck {
  const now = new Date().toISOString();
  return {
    id: uid("deck"),
    schemaVersion: 1,
    brandId: "soch",
    meta: { title, createdAt: now, updatedAt: now },
    slides: [],
  };
}
