import { TEMPLATES } from "@/components/templates/registry";
import type { FieldDef } from "@/components/templates/types";

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
  return TEMPLATES.map((t) => {
    const fields = t.fields.map((f) => describeField(f)).join("\n");
    const example = JSON.stringify(t.defaults());
    return `### ${t.id}  (${t.name}, ${t.background} background)
when to use: ${t.description}
fits content about: ${t.tags.join(", ")}
fields:
${fields}
example fields: ${example}`;
  }).join("\n\n");
}

export const TEMPLATE_IDS = TEMPLATES.map((t) => t.id);
