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
 * The default starter deck — a coherent 5-slide sequence lifted from the
 * reference deck, exercising every core template + background. New users open
 * onto this so they start from something real, not a blank page.
 */
export function seedDeck(): Deck {
  const now = new Date().toISOString();
  return {
    schemaVersion: 1,
    brandId: "soch",
    meta: { title: "AI-Native Teams (starter)", createdAt: now, updatedAt: now },
    slides: [
      slideFrom("title-hero"),
      slideFrom("pull-quote"),
      slideFrom("big-stats"),
      slideFrom("content-list-figures"),
      slideFrom("contact-cta"),
    ],
  };
}
