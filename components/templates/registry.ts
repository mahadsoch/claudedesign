import type { TemplateDef } from "./types";
import { titleHero } from "./title-hero";
import { contentListFigures } from "./content-list-figures";
import { bigStats } from "./big-stats";
import { pullQuote } from "./pull-quote";
import { contactCta } from "./contact-cta";

// Adding a template = import it above + one line here. Nothing else changes.
export const TEMPLATES: TemplateDef[] = [
  titleHero,
  contentListFigures,
  bigStats,
  pullQuote,
  contactCta,
];

const BY_ID: Record<string, TemplateDef> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

export function getTemplate(id: string): TemplateDef | undefined {
  return BY_ID[id];
}
