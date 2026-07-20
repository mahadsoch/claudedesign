import type { TemplateDef } from "./types";
import { titleHero } from "./title-hero";
import { agenda2x2 } from "./agenda-2x2";
import { pullQuote } from "./pull-quote";
import { bigStats } from "./big-stats";
import { contentListFigures } from "./content-list-figures";
import { logoStackGrid } from "./logo-stack-grid";
import { statement } from "./statement";
import { matrix2x2 } from "./matrix-2x2";
import { quadrantHighlight } from "./quadrant-highlight";
import { twoColumnCompare } from "./two-column-compare";
import { resultsNumbers } from "./results-numbers";
import { operatingPrinciple } from "./operating-principle";
import { contactCta } from "./contact-cta";

// Adding a template = import it above + one line here. Nothing else changes.
// Ordered roughly by narrative role (open → frame → make the case → close).
export const TEMPLATES: TemplateDef[] = [
  titleHero,
  agenda2x2,
  pullQuote,
  bigStats,
  contentListFigures,
  logoStackGrid,
  statement,
  matrix2x2,
  quadrantHighlight,
  twoColumnCompare,
  resultsNumbers,
  operatingPrinciple,
  contactCta,
];

const BY_ID: Record<string, TemplateDef> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

export function getTemplate(id: string): TemplateDef | undefined {
  return BY_ID[id];
}
