import type { Deck, Slide, FieldValue } from "./deck";
import { uid } from "./deck";
import { getTemplate } from "@/components/templates/registry";

/** Build a slide from a template's defaults, with optional field overrides. */
function slideFrom(templateId: string, overrides: Record<string, FieldValue> = {}): Slide {
  const tpl = getTemplate(templateId)!;
  return {
    id: uid("sl"),
    template: templateId,
    background: tpl.background,
    fields: { ...tpl.defaults(), ...overrides },
  };
}

/**
 * The "Executive Review" deck template — the full proposal narrative lifted
 * from the reference decks (Context → Problem → Approach → Impact → Investment
 * → Team → Why → Next Steps). Users can start here and edit in place instead of
 * assembling the sequence slide by slide.
 */
export function executiveReviewDeck(): Deck {
  const now = new Date().toISOString();
  return {
    id: uid("deck"),
    schemaVersion: 1,
    brandId: "soch",
    meta: { title: "Executive Review (template)", createdAt: now, updatedAt: now },
    slides: [
      slideFrom("cover-card"),
      slideFrom("agenda-list"),
      slideFrom("context-stat-rail"),
      slideFrom("three-columns"),
      slideFrom("process-stages"),
      slideFrom("feature-grid"),
      slideFrom("impact-highlight"),
      slideFrom("roadmap-phases"),
      slideFrom("pricing-tiers"),
      slideFrom("featured-bio"),
      slideFrom("team-grid"),
      slideFrom("step-timeline"),
      // Close on the dark contact/CTA slide (shows the Soch logo + a call to
      // action), giving the cream body a dark anchor at both ends per DESIGN.md.
      slideFrom("contact-cta"),
    ],
  };
}

/** Deck templates offered in the gallery's "start from a deck" section. */
export interface DeckTemplate {
  id: string;
  name: string;
  description: string;
  slideCount: number;
  build: () => Deck;
}

export const DECK_TEMPLATES: DeckTemplate[] = [
  {
    id: "executive-review",
    name: "Executive Review",
    description: "The full proposal narrative: context, problem, approach, impact, investment, team, next steps and a closing call to action.",
    slideCount: 13,
    build: executiveReviewDeck,
  },
];
