import type { ReactNode } from "react";
import type { Background, FieldValue, SlideElement } from "@/lib/model/deck";

// ── Field schema ────────────────────────────────────────────────────────────
// A template describes its editable content as a list of FieldDefs. The generic
// Inspector walks this list and renders the right input per type — so a new
// template gets its editor UI for free. Guardrails (maxLength, maxItems) live
// here, keeping brand safety declarative.

export type FieldType = "text" | "textarea" | "image" | "list";

export interface FieldDef {
  key: string;
  type: FieldType;
  label: string;
  maxLength?: number;
  placeholder?: string;
  /** Small helper text shown under the input. */
  hint?: string;
  /**
   * For `image` fields: which picker the Inspector shows. "icon" adds a grid of
   * the bundled icon set (values stored as "icon:<name>") alongside upload;
   * omitted means a plain image uploader.
   */
  picker?: "icon";
  // list-only:
  itemFields?: FieldDef[];
  itemLabel?: string; // singular, e.g. "Item", "Stat"
  maxItems?: number;
}

// ── Render context ──────────────────────────────────────────────────────────
export interface RenderCtx {
  /**
   * Resolve an image reference to a usable src. Handles:
   *  - http(s):/data:/public paths → returned as-is
   *  - blob refs ("blob:<id>") → object URL (client) or inlined data URL (PDF)
   */
  resolveImage: (ref: string | undefined) => string | undefined;
}

// ── Template definition ─────────────────────────────────────────────────────
export interface TemplateDef {
  id: string;
  name: string;
  /**
   * One-line "when to use this" guidance. Powers the template gallery and the
   * AI generator's template-selection logic — write it as advice to a chooser,
   * e.g. "Use when a single big metric carries the slide."
   */
  description: string;
  /**
   * Lowercase keywords describing the content this template fits (e.g.
   * "pricing", "roadmap", "team"). Used to rank templates against slide
   * content — both in the gallery search and the AI catalog.
   */
  tags: string[];
  /** Default background; a slide may override it. */
  background: Background;
  fields: FieldDef[];
  /** Seed content for a freshly-inserted slide. */
  defaults: () => Record<string, FieldValue>;
  /**
   * Render the slide body. The caller wraps this in the 1920×1080 Stage with
   * the correct background, so `render` only lays out content.
   */
  render: (fields: Record<string, FieldValue>, ctx: RenderCtx) => ReactNode;
  /**
   * Optional: expand the template into absolutely-positioned elements for the
   * freeform canvas ("Detach to canvas"). Present only on templates that
   * support freeform editing; the Inspector gates the Detach button on it.
   */
  expand?: (fields: Record<string, FieldValue>, ctx: RenderCtx) => SlideElement[];
}

// Convenience accessors with sensible fallbacks.
export const str = (v: FieldValue | undefined, fallback = ""): string =>
  typeof v === "string" ? v : v == null ? fallback : String(v);

export const rows = (v: FieldValue | undefined): Record<string, string>[] =>
  Array.isArray(v) ? (v as Record<string, string>[]) : [];
