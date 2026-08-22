import type { TemplateDef } from "./types";
import { titleHero } from "./title-hero";
import { coverCard } from "./cover-card";
import { agenda2x2 } from "./agenda-2x2";
import { agendaList } from "./agenda-list";
import { pullQuote } from "./pull-quote";
import { bigStats } from "./big-stats";
import { contentListFigures } from "./content-list-figures";
import { contextStatRail } from "./context-stat-rail";
import { threeColumns } from "./three-columns";
import { processStages } from "./process-stages";
import { featureGrid } from "./feature-grid";
import { impactHighlight } from "./impact-highlight";
import { roadmapPhases } from "./roadmap-phases";
import { logoStackGrid } from "./logo-stack-grid";
import { statement } from "./statement";
import { matrix2x2 } from "./matrix-2x2";
import { quadrantHighlight } from "./quadrant-highlight";
import { twoColumnCompare } from "./two-column-compare";
import { resultsNumbers } from "./results-numbers";
import { pricingTiers } from "./pricing-tiers";
import { operatingPrinciple } from "./operating-principle";
import { featuredBio } from "./featured-bio";
import { teamGrid } from "./team-grid";
import { stepTimeline } from "./step-timeline";
import { contactCta } from "./contact-cta";
import { sectionDivider } from "./section-divider";
import { dataBars } from "./data-bars";
import { dataDonut } from "./data-donut";
import { comparisonTable } from "./comparison-table";
import { specTable } from "./spec-table";
import { beforeAfter } from "./before-after";
import { imageFullBleed } from "./image-full-bleed";
import { quotePortrait } from "./quote-portrait";

// Adding a template = import it above + one line here. Nothing else changes.
// Ordered roughly by narrative role (open → frame → make the case → close).
export const TEMPLATES: TemplateDef[] = [
  // Openers
  titleHero,
  coverCard,
  agenda2x2,
  agendaList,
  sectionDivider,
  // Frame the situation
  pullQuote,
  statement,
  imageFullBleed,
  contextStatRail,
  threeColumns,
  // Make the case
  processStages,
  featureGrid,
  bigStats,
  dataBars,
  dataDonut,
  contentListFigures,
  impactHighlight,
  beforeAfter,
  matrix2x2,
  quadrantHighlight,
  twoColumnCompare,
  comparisonTable,
  specTable,
  resultsNumbers,
  quotePortrait,
  roadmapPhases,
  logoStackGrid,
  // Investment
  pricingTiers,
  operatingPrinciple,
  // Team
  featuredBio,
  teamGrid,
  // Close
  stepTimeline,
  contactCta,
];

const BY_ID: Record<string, TemplateDef> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t])
);

export function getTemplate(id: string): TemplateDef | undefined {
  return BY_ID[id];
}
