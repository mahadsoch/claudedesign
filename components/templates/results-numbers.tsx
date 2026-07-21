import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Logo, parseAccents } from "./_shared/primitives";

export const resultsNumbers: TemplateDef = {
  id: "results-numbers",
  name: "Results · number cards",
  description: "Up to three client-result cards, each with a coral hero figure.",
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
      { tag: "SAAS · NORTH AMERICA", name: "RapidCloud Technologies", desc: "Manual onboarding drove early churn.", figure: "14% → 29%", figureLabel: "retention, in 90 days." },
      { tag: "SAAS · NORTH AMERICA", name: "ScaleX SaaS", desc: "No lead process. Everything ad hoc.", figure: "18 / mo", figureLabel: "qualified demos, within 60 days." },
      { tag: "E-COMMERCE · EUROPE", name: "European Retailer", desc: "Manual inventory locked capital in dead stock.", figure: "−42%", figureLabel: "stockouts. €180K freed in 12 weeks." },
    ],
  }),
  render: (f) => {
    const cards = rows(f.cards);
    return (
      <Stage background="dark" style={{ padding: "90px 120px 70px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Kicker>{str(f.kicker)}</Kicker>
            <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 76, letterSpacing: -2.5, lineHeight: 1.05, margin: "24px 0 0" }}>
              {parseAccents(str(f.title))}
            </h2>
          </div>
          <Logo height={36} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(cards.length, 1)}, 1fr)`, gap: 26, marginTop: 60, flex: 1, minHeight: 0 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ background: "#1E1E1E", border: "1px solid #33302A", borderRadius: 22, padding: "38px 42px", display: "flex", flexDirection: "column", gap: 18 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 2, color: "var(--warm-gray)" }}>{c.tag}</div>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 34, letterSpacing: -0.5 }}>{c.name}</div>
              <p style={{ fontSize: 25, lineHeight: 1.5, color: "var(--body-dark-3)", margin: 0, flex: 1 }}>{c.desc}</p>
              <div style={{ borderTop: "1px solid #33302A", paddingTop: 24 }}>
                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 52, letterSpacing: -1.5, color: "var(--coral)", lineHeight: 1.05 }}>{c.figure}</div>
                <div style={{ fontSize: 25, color: "var(--body-dark-3)", marginTop: 10 }}>{c.figureLabel}</div>
              </div>
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
