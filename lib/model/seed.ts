import type { Deck, Slide, FieldValue, Background } from "./deck";
import { uid } from "./deck";
import { getTemplate } from "@/components/templates/registry";

/**
 * Build a slide from a template's defaults.
 *
 * The background is a property of the *slide*, not the template — the template
 * only supplies a default. Passing one explicitly is how a deck composes
 * DESIGN.md's background rhythm: dark anchors, coral for the emotional beats,
 * cream for the workhorse content, and never more than two cream in a row.
 */
export function slideFrom(
  templateId: string,
  background?: Background,
  overrides: Record<string, FieldValue> = {}
): Slide {
  const tpl = getTemplate(templateId)!;
  return {
    id: uid("sl"),
    template: templateId,
    background: background ?? tpl.background,
    fields: { ...tpl.defaults(), ...overrides },
  };
}

/**
 * The default starter deck — a coherent sequence lifted from the reference
 * deck, exercising every core template and all three backgrounds. New users
 * open onto this so they start from something real, not a blank page.
 */
export function seedDeck(): Deck {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    brandId: "soch",
    meta: { title: "AI-Native Teams (starter)", createdAt: now, updatedAt: now },
    slides: [
      slideFrom("title-hero", "dark"),
      slideFrom("agenda-2x2", "cream"),
      slideFrom("pull-quote", "coral"),
      slideFrom("big-stats", "dark"),
      slideFrom("content-list-figures", "cream"),
      slideFrom("logo-stack-grid", "cream"),
      slideFrom("statement", "dark"),
      slideFrom("matrix-2x2", "cream"),
      slideFrom("quadrant-highlight", "cream"),
      slideFrom("two-column-compare", "dark"),
      slideFrom("results-numbers", "cream"),
      slideFrom("operating-principle", "coral"),
      slideFrom("contact-cta", "dark"),
    ],
  };
}
