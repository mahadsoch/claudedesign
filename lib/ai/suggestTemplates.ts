import { TEMPLATES } from "@/components/templates/registry";
import type { TemplateDef } from "@/components/templates/types";

// Lightweight, dependency-free content → template matching. Given a scrap of
// text (a search query, a slide heading, or a paragraph of a brief), score each
// template by how well its tags / name / description overlap the text. Used to
// rank the gallery and to power the "suggested templates" hints. This is a
// heuristic aid, not a hard filter — every template stays reachable.

const STOP = new Set([
  "the", "a", "an", "and", "or", "of", "to", "for", "in", "on", "with", "is",
  "are", "our", "your", "you", "this", "that", "it", "we", "how", "what", "why",
  "from", "at", "by", "be", "as", "will", "can", "not", "no", "yet",
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => w.length > 2 && !STOP.has(w));
}

function scoreTemplate(tokens: string[], tpl: TemplateDef): number {
  if (tokens.length === 0) return 0;
  const tagSet = new Set(tpl.tags.flatMap((t) => tokenize(t)));
  const nameSet = new Set(tokenize(tpl.name));
  const descSet = new Set(tokenize(tpl.description));
  let score = 0;
  for (const tok of tokens) {
    if (tagSet.has(tok)) score += 3; // tags are the strongest signal
    if (nameSet.has(tok)) score += 2;
    if (descSet.has(tok)) score += 1;
  }
  return score;
}

export interface TemplateMatch {
  template: TemplateDef;
  score: number;
}

/** Rank every template against the text (highest first). Score 0 means no match. */
export function rankTemplates(text: string): TemplateMatch[] {
  const tokens = tokenize(text);
  return TEMPLATES.map((template) => ({ template, score: scoreTemplate(tokens, template) })).sort(
    (a, b) => b.score - a.score
  );
}

/** The single best-fit template id for a piece of content, or undefined if nothing matches. */
export function suggestTemplate(text: string): string | undefined {
  const [best] = rankTemplates(text);
  return best && best.score > 0 ? best.template.id : undefined;
}
