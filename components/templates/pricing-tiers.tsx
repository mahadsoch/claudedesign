import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Card, Rule, Stat, Pill, Mark, tone, TYPE } from "./_shared/primitives";

// The "Investment" slide. Two things a pricing slide needs that this one did
// not have: a recommended tier that actually looks recommended, and a list of
// what each tier includes so the prices can be compared on something.
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
        { key: "desc", type: "textarea", label: "Description", maxLength: 140 },
        { key: "inc1", type: "text", label: "Includes 1", maxLength: 44 },
        { key: "inc2", type: "text", label: "Includes 2", maxLength: 44 },
        { key: "inc3", type: "text", label: "Includes 3", maxLength: 44 },
        {
          key: "featured",
          type: "select",
          label: "Emphasis",
          options: [
            { value: "no", label: "Standard" },
            { value: "yes", label: "Recommended (filled)" },
          ],
        },
        { key: "badge", type: "text", label: "Badge", maxLength: 16, placeholder: "START HERE" },
      ],
    },
    { key: "footnote", type: "textarea", label: "Footnote", maxLength: 160 },
  ],
  defaults: () => ({
    kicker: "05 · INVESTMENT",
    title: "Investment",
    tiers: [
      {
        label: "DISCOVERY", price: "€6,000", terms: "fixed · 2–3 weeks",
        desc: "50% on signing, 50% on blueprint.",
        inc1: "Architecture memo", inc2: "Evaluation plan", inc3: "Fixed Build price",
        featured: "yes", badge: "START HERE",
      },
      {
        label: "BUILD", price: "€15–20k", terms: "fixed · 6–8 weeks",
        desc: "50% on signing, 50% on handover. The exact figure is confirmed at the end of Discovery.",
        inc1: "Production rebuild", inc2: "Error handling & tests", inc3: "Runbook & handover",
        featured: "no", badge: "",
      },
      {
        label: "SCALE & SUPPORT", price: "Optional", terms: "from €4,000 / block",
        desc: "Rollout, integration and monitoring as needed.",
        inc1: "Waved rollout", inc2: "Monitoring", inc3: "€100/hr blended rate",
        featured: "no", badge: "",
      },
    ],
    footnote: "Indicative — the final fixed Build price is set at the end of Discovery, on the agreed scope.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const tiers = rows(f.tiers);
    const n = Math.max(tiers.length, 1);
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />
        <div
          style={{
            marginTop: "var(--s6)",
            flex: 1,
            display: "grid",
            gridTemplateColumns: n === 1 ? "minmax(0, 640px)" : `repeat(${n}, 1fr)`,
            gap: "var(--s4)",
            alignItems: "stretch",
            minHeight: 0,
          }}
        >
          {tiers.map((tier, i) => {
            const featured = str(tier.featured) === "yes";
            const includes = [tier.inc1, tier.inc2, tier.inc3].filter(Boolean);
            return (
              <Card
                key={i}
                tone={t}
                emphasis={featured ? "accent" : "none"}
                style={{ padding: "44px 46px", position: "relative", minWidth: 0 }}
              >
                {featured && str(tier.badge) && (
                  <div style={{ position: "absolute", top: -16, left: 46 }}>
                    <Pill
                      tone={t}
                      size={14}
                      style={{ background: t.title, color: t.bg === "cream" ? "var(--cream)" : "var(--ink)" }}
                    >
                      {str(tier.badge)}
                    </Pill>
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: TYPE.kickerSm,
                    letterSpacing: 3,
                    fontWeight: 600,
                    color: featured ? t.onAccent : t.muted,
                  }}
                >
                  {tier.label}
                </div>
                <Stat
                  value={str(tier.price)}
                  size={TYPE.h3}
                  color={featured ? t.onAccent : t.accent}
                  style={{ margin: "22px 0 12px" }}
                />
                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: TYPE.bodySm + 2 }}>
                  {tier.terms}
                </div>
                <p
                  style={{
                    fontSize: TYPE.bodySm,
                    lineHeight: 1.5,
                    color: featured ? t.onAccent : t.body,
                    margin: "22px 0 0",
                    opacity: featured ? 0.9 : 1,
                  }}
                >
                  {tier.desc}
                </p>
                {includes.length > 0 && (
                  <>
                    <Rule
                      tone={t}
                      color={featured ? t.onAccent : undefined}
                      style={{ margin: "26px 0 22px", opacity: featured ? 0.35 : 1 }}
                    />
                    <div style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: "auto" }}>
                      {includes.map((inc, j) => (
                        <div key={j} style={{ display: "flex", gap: 14, alignItems: "center" }}>
                          <Mark kind="yes" size={22} color={featured ? t.onAccent : t.accent} />
                          <span
                            style={{
                              fontSize: TYPE.bodySm,
                              lineHeight: 1.35,
                              color: featured ? t.onAccent : t.bodyStrong,
                            }}
                          >
                            {inc}
                          </span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </Card>
            );
          })}
        </div>
        {str(f.footnote) && (
          <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "var(--s5) 0 0" }}>
            {str(f.footnote)}
          </p>
        )}
      </Stage>
    );
  },
};
