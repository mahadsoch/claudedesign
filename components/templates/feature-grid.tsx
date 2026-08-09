import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, IconChip, Numeral, Rule, Card, tone, TYPE, titleTracking } from "./_shared/primitives";

// Capabilities / features. The default is a ruled editorial grid rather than a
// row of identical rounded boxes: a hairline over each cell, a mono index, and
// the icon inline with the heading. An incomplete last row reads as intentional
// under rules, where it read as a hole under cards.
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
      key: "layout",
      type: "select",
      label: "Layout",
      options: [
        { value: "ruled", label: "Ruled grid (editorial)" },
        { value: "cards", label: "Cards" },
      ],
    },
    {
      key: "cards",
      type: "list",
      label: "Cards",
      itemLabel: "Card",
      maxItems: 6,
      itemFields: [
        { key: "icon", type: "image", label: "Icon", picker: "icon" },
        { key: "title", type: "text", label: "Title", maxLength: 40 },
        // Trimmed from 160: at six cards, 160-char bodies overflowed the row
        // height, and PPTX does not clip overflowing text.
        { key: "body", type: "textarea", label: "Body", maxLength: 130 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "03 · THE APPROACH",
    title: "What the Build covers",
    intro: "All on your existing stack. n8n, Claude API, Gmail — no external egress.",
    layout: "ruled",
    cards: [
      { icon: "icon:workflow", title: "Architecture redesign", body: "Clear node responsibilities, structured prompts, deterministic data passing, explicit errors." },
      { icon: "icon:rocket", title: "Production rebuild", body: "The hardened version built on your instance. The old proof of concept kept as backup." },
      { icon: "icon:shield", title: "Error handling", body: "Explicit handling for common failures, retry logic, and a log so you see what failed." },
      { icon: "icon:test", title: "Edge-case testing", body: "Run against a real batch: multiple currencies, odd vendors, malformed inputs." },
      { icon: "icon:book", title: "Handover & runbook", body: "How the flow runs, where prompts live, how to debug, swap models, and extend it." },
      { icon: "icon:eye", title: "Monitoring", body: "A simple dashboard for throughput, failures and cost, reviewed at handover." },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const cards = rows(f.cards);
    const ruled = str(f.layout, "ruled") === "ruled";
    const cols = cards.length <= 4 ? 2 : 3;
    return (
      <Stage background={ctx.background} style={{ display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />
        {str(f.intro) && (
          <p style={{ fontSize: TYPE.body, lineHeight: 1.5, color: t.body, margin: "22px 0 0", maxWidth: 1200 }}>
            {str(f.intro)}
          </p>
        )}
        <div
          style={{
            marginTop: "var(--s6)",
            flex: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            columnGap: ruled ? "var(--s6)" : "var(--s3)",
            rowGap: ruled ? "var(--s5)" : "var(--s3)",
            minHeight: 0,
          }}
        >
          {cards.map((c, i) =>
            ruled ? (
              <div key={i} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Rule tone={t} weight="1" color={t.ruleStrong} />
                <div style={{ display: "flex", alignItems: "center", gap: 16, margin: "22px 0 18px" }}>
                  <IconChip value={str(c.icon)} resolve={ctx.resolveImage} tone={t} size={48} radius={12} />
                  <Numeral n={i + 1} tone={t} size={TYPE.kickerSm} color={t.muted} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h6,
                    letterSpacing: titleTracking(TYPE.h6),
                    color: t.title,
                  }}
                >
                  {c.title}
                </div>
                <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "12px 0 0" }}>
                  {c.body}
                </p>
              </div>
            ) : (
              <Card key={i} tone={t} style={{ gap: 18, padding: "34px 38px" }}>
                <IconChip value={str(c.icon)} resolve={ctx.resolveImage} tone={t} size={60} radius={14} />
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h6 - 3,
                    letterSpacing: titleTracking(TYPE.h6),
                  }}
                >
                  {c.title}
                </div>
                <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: 0 }}>{c.body}</p>
              </Card>
            )
          )}
        </div>
      </Stage>
    );
  },
};
