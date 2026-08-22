import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Numeral, Rule, SlideFooter, tone, TYPE, titleTracking } from "./_shared/primitives";

export const agenda2x2: TemplateDef = {
  id: "agenda-2x2",
  name: "Agenda · 2×2",
  description: "A four-point agenda or overview laid out as a 2×2 grid with roman numerals.",
  tags: ["agenda", "overview", "contents", "sections", "outline"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "footer", type: "text", label: "Footer label", maxLength: 30 },
    {
      key: "items",
      type: "list",
      label: "Agenda items",
      itemLabel: "Item",
      maxItems: 4,
      itemFields: [
        { key: "head", type: "text", label: "Heading", maxLength: 40 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 90 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "WHAT WE'LL COVER",
    footer: "AI-NATIVE PLAYBOOK",
    items: [
      { head: "Why most AI rollouts fail", desc: "The real reason pilots stall. It's not the tools." },
      { head: "The AI-native framework", desc: "A 2×2 to place your team today, and where it needs to go." },
      { head: "Tops-down and bottoms-up", desc: "What each actually looks like inside a small team." },
      { head: "How to start in four weeks", desc: "The path from audit to first automation." },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const items = rows(f.items).slice(0, 4);
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "100px var(--pad-x) 128px", display: "flex", flexDirection: "column" }}
      >
        <Kicker>{str(f.kicker)}</Kicker>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "1fr 1fr",
            marginTop: "var(--s6)",
            flex: 1,
            minHeight: 0,
          }}
        >
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                // Asymmetric cell padding creates the gutter — a `gap` would
                // pull the rules apart and break the row alignment.
                padding: i % 2 === 0 ? "44px 60px 30px 0" : "44px 0 30px 60px",
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
              }}
            >
              <Rule tone={t} weight="1" color={t.ruleStrong} style={{ marginTop: -44, marginBottom: 44 }} />
              <div style={{ display: "flex", gap: 36, minHeight: 0 }}>
                <Numeral n={i + 1} tone={t} variant="roman" size={TYPE.body} style={{ minWidth: 60, paddingTop: 8 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  <h3
                    style={{
                      fontFamily: "var(--font-title)",
                      fontWeight: 600,
                      fontSize: TYPE.h4,
                      letterSpacing: titleTracking(TYPE.h4),
                      margin: 0,
                      lineHeight: 1.15,
                      color: t.title,
                    }}
                  >
                    {it.head}
                  </h3>
                  <p style={{ fontSize: TYPE.body, lineHeight: 1.5, color: t.body, margin: 0 }}>{it.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        <SlideFooter
          tone={t}
          label={str(f.footer)}
          slideNumber={ctx.slideNumber}
          slideCount={ctx.slideCount}
        />
      </Stage>
    );
  },
};
