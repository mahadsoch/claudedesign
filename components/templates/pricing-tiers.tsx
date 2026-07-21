import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead } from "./_shared/primitives";

// The "Investment" slide: up to three pricing tiers, each a label, a big coral
// price, a terms line and a description, with a closing note below.
export const pricingTiers: TemplateDef = {
  id: "pricing-tiers",
  name: "Pricing tiers",
  description: "Two or three pricing tiers, each with a headline price, terms and what's included.",
  tags: ["pricing", "investment", "cost", "tiers", "budget", "fees", "packages"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "05 · INVESTMENT" },
    { key: "title", type: "textarea", label: "Title", maxLength: 40, hint: "Wrap accent in [[…]]" },
    {
      key: "tiers",
      type: "list",
      label: "Tiers",
      itemLabel: "Tier",
      maxItems: 3,
      itemFields: [
        { key: "label", type: "text", label: "Label", maxLength: 24, placeholder: "DISCOVERY" },
        { key: "price", type: "text", label: "Price", maxLength: 20, placeholder: "€6,000" },
        { key: "terms", type: "text", label: "Terms", maxLength: 30, placeholder: "fixed · 2–3 weeks" },
        { key: "desc", type: "textarea", label: "Description", maxLength: 180 },
      ],
    },
    { key: "footnote", type: "textarea", label: "Footnote", maxLength: 160 },
  ],
  defaults: () => ({
    kicker: "05 · INVESTMENT",
    title: "Investment",
    tiers: [
      { label: "DISCOVERY", price: "€6,000", terms: "fixed · 2–3 weeks", desc: "50% on signing, 50% on blueprint. Output: architecture memo, evaluation plan, access map, fixed Build price." },
      { label: "BUILD", price: "€15,000–20,000", terms: "fixed · 6–8 weeks", desc: "50% on signing, 50% on handover. The exact figure within the range is confirmed at the end of Discovery." },
      { label: "SCALE & SUPPORT", price: "Optional", terms: "from €4,000 / block", desc: "Rollout, integration and monitoring as needed. €100/hr blended mission-partner rate for human-in-the-loop." },
    ],
    footnote: "Indicative — the final fixed Build price is set at the end of Discovery, on the agreed scope.",
  }),
  render: (f) => {
    const tiers = rows(f.tiers);
    return (
      <Stage background="cream" style={{ padding: "90px 130px 70px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        <div style={{ marginTop: 56, flex: 1, display: "grid", gridTemplateColumns: `repeat(${Math.max(tiers.length, 1)}, 1fr)`, gap: 30, minHeight: 0 }}>
          {tiers.map((t, i) => (
            <div key={i} style={{ background: "var(--card-fill)", border: "1px solid var(--card-border)", borderRadius: 22, padding: "44px 46px", display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: 3, fontWeight: 600, color: "var(--warm-gray)" }}>{t.label}</div>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 60, letterSpacing: -2, color: "var(--coral)", margin: "22px 0 12px", lineHeight: 1 }}>{t.price}</div>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 24 }}>{t.terms}</div>
              <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "22px 0 0" }}>{t.desc}</p>
            </div>
          ))}
        </div>
        {str(f.footnote) && (
          <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "40px 0 0" }}>{str(f.footnote)}</p>
        )}
      </Stage>
    );
  },
};
