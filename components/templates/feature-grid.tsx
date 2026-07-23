import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, IconChip } from "./_shared/primitives";

// A grid of feature / capability cards, each an icon chip, a title and a short
// body. Covers "what the build covers", "why this is low risk", and "who you
// will work with". Cards wrap into a tidy responsive grid.
export const featureGrid: TemplateDef = {
  id: "feature-grid",
  name: "Feature grid",
  description: "A grid of capability cards (icon + title + body) — features, reasons, or what's covered.",
  tags: ["features", "grid", "cards", "capabilities", "why", "covers", "reasons"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "03 · THE APPROACH" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "intro", type: "textarea", label: "Intro", maxLength: 140 },
    {
      key: "cards",
      type: "list",
      label: "Cards",
      itemLabel: "Card",
      maxItems: 6,
      itemFields: [
        { key: "icon", type: "image", label: "Icon", picker: "icon" },
        { key: "title", type: "text", label: "Title", maxLength: 40 },
        { key: "body", type: "textarea", label: "Body", maxLength: 160 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "03 · THE APPROACH",
    title: "What the Build covers",
    intro: "All on your existing stack. n8n, Claude API, Gmail — no external egress.",
    cards: [
      { icon: "icon:workflow", title: "Architecture redesign", body: "Clear node responsibilities, structured prompts, deterministic data passing, explicit errors." },
      { icon: "icon:rocket", title: "Production rebuild", body: "The hardened version built on your instance. The old proof of concept kept as backup." },
      { icon: "icon:shield", title: "Error handling & monitoring", body: "Explicit handling for common failures, retry logic, and a simple log so you see what failed." },
      { icon: "icon:test", title: "Edge-case testing", body: "Run against a real batch: multiple currencies, odd vendors, malformed and multi-page inputs." },
      { icon: "icon:book", title: "Handover & runbook", body: "How the flow runs, where prompts live, how to debug, swap models, and extend it." },
    ],
  }),
  render: (f, ctx) => {
    const cards = rows(f.cards);
    const cols = cards.length <= 4 ? 2 : 3;
    return (
      <Stage background="cream" style={{ padding: "90px 130px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        {str(f.intro) && (
          <p style={{ fontSize: 26, lineHeight: 1.5, color: "var(--body-light)", margin: "22px 0 0", maxWidth: 1200 }}>
            {str(f.intro)}
          </p>
        )}
        <div style={{ marginTop: 48, flex: 1, display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 26, minHeight: 0 }}>
          {cards.map((c, i) => (
            <div
              key={i}
              style={{
                background: "var(--card-fill)",
                border: "1px solid var(--card-border)",
                borderRadius: 22,
                padding: "34px 38px",
                display: "flex",
                flexDirection: "column",
                gap: 18,
              }}
            >
              <IconChip value={str(c.icon)} resolve={ctx.resolveImage} size={60} radius={14} />
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 27, letterSpacing: -0.5 }}>{c.title}</div>
              <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
