import { TEMPLATES, getTemplate } from "@/components/templates/registry";
import type { FieldDef, TemplateDef } from "@/components/templates/types";

// Serialize the registry into a compact, prompt-ready description so the AI can
// only ever emit slides that map to a real template with real field keys. This
// is the single source that keeps the generator in sync with the templates.

function describeField(f: FieldDef, indent = ""): string {
  if (f.type === "list") {
    const items = (f.itemFields ?? []).map((s) => describeField(s, indent + "    ")).join("\n");
    const cap = f.maxItems ? ` (max ${f.maxItems})` : "";
    return `${indent}- ${f.key}: list${cap} of objects with fields:\n${items}`;
  }
  const cap = f.maxLength ? ` (≤${f.maxLength} chars)` : "";
  const hint = f.hint ? ` — ${f.hint}` : "";
  return `${indent}- ${f.key}: ${f.type}${cap}${hint}`;
}

export function templateCatalog(): string {
  return TEMPLATES.map((t) => describeTemplate(t, true)).join("\n\n");
}

/** A single template's spec (id, name, fields, example). `withGuidance` adds the
 *  "when to use" + tags lines used when the model is choosing a template. */
export function describeTemplate(t: TemplateDef, withGuidance = false): string {
  const fields = t.fields.map((f) => describeField(f)).join("\n");
  const example = JSON.stringify(t.defaults());
  const guidance = withGuidance
    ? `\nwhen to use: ${t.description}\nfits content about: ${t.tags.join(", ")}`
    : "";
  return `### ${t.id}  (${t.name}, ${t.background} background)${guidance}
fields:
${fields}
example fields: ${example}`;
}

/** The field spec for one template id, for the fill pass (no guidance needed). */
export function templateSpec(id: string): string {
  const t = getTemplate(id);
  return t ? describeTemplate(t, false) : `### ${id}\n(unknown template)`;
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);
