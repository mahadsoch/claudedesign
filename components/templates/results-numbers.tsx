import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Logo, Rule, Stat, Card, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

export const resultsNumbers: TemplateDef = {
  id: "results-numbers",
  name: "Results · number cards",
  description: "Up to three client-result cards, each led by a hero figure.",
  tags: ["results", "case studies", "clients", "outcomes", "numbers"],
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 44 },
    { key: "title", type: "textarea", label: "Title", maxLength: 40, hint: "Wrap accent in [[…]]" },
    {
      key: "cards",
      type: "list",
      label: "Result cards",
      itemLabel: "Card",
      maxItems: 3,
      itemFields: [
        { key: "tag", type: "text", label: "Tag", maxLength: 28, placeholder: "SAAS · NORTH AMERICA" },
        { key: "name", type: "text", label: "Name", maxLength: 30 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 70 },
        { key: "figure", type: "text", label: "Figure", maxLength: 12, placeholder: "14% → 29%" },
        { key: "figureLabel", type: "text", label: "Figure label", maxLength: 40 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "THREE CLIENTS · LAST 12 MONTHS",
    title: "Real numbers.",
    cards: [
      { tag: "SAAS · NORTH AMERICA", name: "RapidCloud Technologies", desc: "Manual onboarding drove early churn.", figure: "14→29%", figureLabel: "retention, in 90 days." },
      { tag: "SAAS · NORTH AMERICA", name: "ScaleX SaaS", desc: "No lead process. Everything ad hoc.", figure: "18 / mo", figureLabel: "qualified demos, within 60 days." },
      { tag: "E-COMMERCE · EUROPE", name: "European Retailer", desc: "Manual inventory locked capital in dead stock.", figure: "−42%", figureLabel: "stockouts. €180K freed in 12 weeks." },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const cards = rows(f.cards);
    const n = Math.max(cards.length, 1);
    // The figure now opens the card and is set at hero scale. It used to sit at
    // the bottom at 52px — smaller than the slide title, on a slide whose whole
    // argument is "real numbers".
    const figure = n === 1 ? TYPE.statMd + 30 : n === 2 ? TYPE.statMd : TYPE.statSm + 12;
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Kicker>{str(f.kicker)}</Kicker>
            <h2
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: TYPE.statSm,
                letterSpacing: titleTracking(TYPE.statSm),
                lineHeight: 1.05,
                margin: "24px 0 0",
                color: t.title,
              }}
            >
              {parseAccents(str(f.title))}
            </h2>
          </div>
          <Logo height={36} />
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: n === 1 ? "minmax(0, 760px)" : `repeat(${n}, 1fr)`,
            gap: "var(--s3)",
            marginTop: "var(--s7)",
            flex: 1,
            minHeight: 0,
          }}
        >
          {cards.map((c, i) => (
            <Card key={i} tone={t} style={{ gap: 16, padding: "40px 42px" }}>
              <Stat value={str(c.figure)} size={figure} color={t.accent} />
              <div style={{ fontSize: TYPE.body - 1, color: t.body, marginBottom: 4 }}>{c.figureLabel}</div>
              <Rule tone={t} color={t.panelBorder === "none" ? t.rule : t.panelBorder} style={{ margin: "8px 0 16px" }} />
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: TYPE.kickerSm,
                  letterSpacing: 2,
                  color: t.muted,
                }}
              >
                {c.tag}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: TYPE.h5 - 4,
                  letterSpacing: titleTracking(TYPE.h5),
                  marginTop: 10,
                }}
              >
                {c.name}
              </div>
              <p style={{ fontSize: TYPE.body - 1, lineHeight: 1.5, color: t.body, margin: "10px 0 0" }}>
                {c.desc}
              </p>
            </Card>
          ))}
        </div>
      </Stage>
    );
  },
};
