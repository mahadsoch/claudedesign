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
 * The default starter deck — a coherent multi-slide sequence lifted from the
 * reference deck, exercising a spread of core templates + backgrounds. New users
 * open onto this so they start from something real, not a blank page.
 */
export function seedDeck(): Deck {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    brandId: "soch",
    meta: { title: "AI-Native Teams (starter)", createdAt: now, updatedAt: now },
    slides: [
      slideFrom("title-hero"),
      slideFrom("agenda-2x2"),
      slideFrom("pull-quote"),
      slideFrom("big-stats"),
      slideFrom("content-list-figures"),
      slideFrom("logo-stack-grid"),
      slideFrom("statement"),
      slideFrom("matrix-2x2"),
      slideFrom("quadrant-highlight"),
      slideFrom("two-column-compare"),
      slideFrom("results-numbers"),
      slideFrom("operating-principle"),
      slideFrom("contact-cta"),
    ],
  };
}
