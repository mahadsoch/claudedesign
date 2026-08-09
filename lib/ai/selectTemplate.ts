import { getTemplate } from "@/components/templates/registry";
import { rankTemplates } from "@/lib/ai/suggestTemplates";
import type { Background } from "@/lib/model/deck";

// Content-driven template selection for AI generation. The generator plans a
// deck as a list of { intent, contentType } beats; this module turns each beat
// into a concrete template id — deterministically, on the server — so template
// choice is grounded in what the slide is about rather than left to the model's
// guess. Each content type maps to an ordered shortlist of templates; among the
// shortlist we pick by keyword fit to the intent, then nudge for variety.

export interface ContentType {
  id: string;
  label: string;
  /** Candidate templates, best-fit first. */
  templates: string[];
}

export const CONTENT_TYPES: ContentType[] = [
  { id: "cover", label: "Opening title / cover slide", templates: ["title-hero", "cover-card"] },
  { id: "agenda", label: "Agenda or table of contents", templates: ["agenda-list", "agenda-2x2"] },
  { id: "context", label: "Context / where things stand today, with a few figures", templates: ["context-stat-rail", "big-stats"] },
  { id: "problem", label: "A problem framed as a few parallel points", templates: ["three-columns", "content-list-figures"] },
  { id: "approach", label: "The approach as phased stages", templates: ["process-stages", "step-timeline"] },
  { id: "features", label: "Capabilities / what's covered / reasons", templates: ["feature-grid", "content-list-figures"] },
  { id: "metrics", label: "One or a few big headline metrics", templates: ["big-stats", "quadrant-highlight"] },
  { id: "impact", label: "Outcomes plus the single metric to chase", templates: ["impact-highlight", "content-list-figures"] },
  { id: "framework", label: "A 2×2 or positioning framework", templates: ["matrix-2x2", "quadrant-highlight"] },
  { id: "comparison", label: "Two options, or before vs after", templates: ["two-column-compare"] },
  { id: "results", label: "Client results / case studies", templates: ["results-numbers", "big-stats"] },
  { id: "roadmap", label: "A phased roadmap / rollout over time", templates: ["roadmap-phases", "process-stages"] },
  { id: "logos", label: "Logos, tools, or integrations", templates: ["logo-stack-grid"] },
  { id: "pricing", label: "Pricing / investment tiers", templates: ["pricing-tiers"] },
  { id: "principles", label: "Operating principles / how we work", templates: ["operating-principle"] },
  { id: "quote", label: "A single strong quote or belief", templates: ["pull-quote", "statement"] },
  { id: "statement", label: "A bold one-line statement / anchor moment", templates: ["statement", "pull-quote"] },
  { id: "bio", label: "Spotlight on one person", templates: ["featured-bio"] },
  { id: "team", label: "The team / people roster", templates: ["team-grid"] },
  { id: "nextsteps", label: "Next steps / the path to kickoff", templates: ["step-timeline", "contact-cta"] },
  { id: "closing", label: "Closing call to action / contact", templates: ["contact-cta", "step-timeline"] },
];

const BY_CT: Record<string, ContentType> = Object.fromEntries(CONTENT_TYPES.map((c) => [c.id, c]));

/** A compact menu of content types for the planning prompt. */
export function contentTypeMenu(): string {
  return CONTENT_TYPES.map((c) => `- ${c.id}: ${c.label}`).join("\n");
}

export interface PlanBeat {
  intent: string;
  contentType: string;
}

/**
 * Turn a plan into concrete template ids. Selection per beat:
 *  1. take the content type's shortlist (fall back to a keyword match on the
 *     intent, then to a safe default);
 *  2. among the shortlist, prefer the candidate that best fits the intent text
 *     (keyword ranker), breaking ties by shortlist order;
 *  3. nudge for variety — avoid repeating the previous slide's template, and
 *     avoid using any one template more than twice, when a fresh candidate is
 *     available.
 * Always returns valid registry ids, one per beat.
 */
export function chooseTemplates(beats: PlanBeat[]): string[] {
  const used = new Map<string, number>();
  const out: string[] = [];
  let prev = "";

  for (const beat of beats) {
    const ct = BY_CT[beat.contentType];
    let shortlist = (ct?.templates ?? []).filter((id) => getTemplate(id));

    // No usable content type → derive candidates from the intent text.
    if (shortlist.length === 0) {
      const ranked = rankTemplates(`${beat.contentType} ${beat.intent}`).filter((r) => r.score > 0);
      shortlist = ranked.slice(0, 3).map((r) => r.template.id);
    }
    if (shortlist.length === 0) shortlist = ["content-list-figures"];

    // Order the shortlist by keyword fit to the intent (stable within ties).
    const rankScore = new Map(rankTemplates(beat.intent).map((r) => [r.template.id, r.score]));
    const ordered = [...shortlist].sort((a, b) => (rankScore.get(b) ?? 0) - (rankScore.get(a) ?? 0));

    // Prefer a candidate that isn't the previous template and isn't overused.
    const pick =
      ordered.find((id) => id !== prev && (used.get(id) ?? 0) < 2) ??
      ordered.find((id) => (used.get(id) ?? 0) < 2) ??
      ordered[0];

    out.push(pick);
    used.set(pick, (used.get(pick) ?? 0) + 1);
    prev = pick;
  }

  return out;
}

// ── Background rhythm ───────────────────────────────────────────────────────
// DESIGN.md: dark anchors the deck (open, impact, close), coral carries the
// emotional beats (quotes and principles), cream does the workhorse content,
// and no two adjacent slides share a heavy background unless intended.
//
// This could not previously happen at all: `validateDeck` overwrote whatever
// the model chose with the template's own default, and most templates default
// to cream — so the recommended spine produced one dark slide followed by ten
// consecutive cream ones, with no coral anywhere.

/** Content types that *are* the emotional beat, and belong on coral. */
const CORAL_TYPES = new Set(["quote", "principles"]);
/** Content types that anchor the deck, and belong on ink. */
const DARK_TYPES = new Set(["cover", "statement", "metrics", "results", "closing", "comparison"]);

const MAX_CREAM_RUN = 2;

/**
 * Assign a background per slide from the planned beats, honouring the rhythm.
 * Returns one background per beat, aligned with `chooseTemplates`' output.
 */
export function assignBackgrounds(beats: PlanBeat[], templateIds: string[]): Background[] {
  const out: Background[] = [];
  let creamRun = 0;

  beats.forEach((beat, i) => {
    const isFirst = i === 0;
    const isLast = i === beats.length - 1;
    const tpl = getTemplate(templateIds[i] ?? "");
    let bg: Background;

    if (CORAL_TYPES.has(beat.contentType)) bg = "coral";
    else if (isFirst || isLast || DARK_TYPES.has(beat.contentType)) bg = "dark";
    else if (creamRun >= MAX_CREAM_RUN) {
      // The run has gone on too long. Break it with the heavier of the two —
      // dark unless the template's own default says this is a coral moment.
      bg = tpl?.background === "coral" ? "coral" : "dark";
    } else bg = "cream";

    // Never repeat a heavy background on adjacent slides; drop back to cream.
    if (bg !== "cream" && out[i - 1] === bg) bg = "cream";

    creamRun = bg === "cream" ? creamRun + 1 : 0;
    out.push(bg);
  });

  return out;
}
