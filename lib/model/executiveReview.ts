import type { Deck } from "./deck";
import { slideFrom } from "./seed";

/**
 * The "Executive Review" deck template — the full proposal narrative lifted
 * from the reference decks (Context → Problem → Approach → Impact → Investment
 * → Team → Why → Next Steps). Users can start here and edit in place instead of
 * assembling the sequence slide by slide.
 *
 * Backgrounds are set explicitly. Left to the template defaults this deck ran
 * eleven consecutive cream slides between its cover and its close, which is the
 * single most visible way a generated deck reads as flat.
 */
export function executiveReviewDeck(): Deck {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    brandId: "soch",
    meta: { title: "Executive Review (template)", createdAt: now, updatedAt: now },
    slides: [
      slideFrom("cover-card", "cream"), // open on the inset ink card
      slideFrom("agenda-list", "cream"),
      slideFrom("context-stat-rail", "dark"), // first anchor
      slideFrom("three-columns", "cream"),
      slideFrom("process-stages", "cream"),
      slideFrom("operating-principle", "coral"), // the emotional beat, mid-deck
      slideFrom("feature-grid", "cream"),
      slideFrom("impact-highlight", "cream"),
      slideFrom("roadmap-phases", "dark"),
      slideFrom("pricing-tiers", "cream"),
      slideFrom("featured-bio", "cream"),
      slideFrom("team-grid", "dark"),
      slideFrom("step-timeline", "cream"),
      slideFrom("contact-cta", "dark"), // close on the dark bookend
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
    description:
      "The full proposal narrative: context, problem, approach, impact, investment, team, next steps and a closing call to action.",
    slideCount: 14,
    build: executiveReviewDeck,
  },
];
