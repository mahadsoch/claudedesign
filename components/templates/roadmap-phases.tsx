import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Pill, Rule, tone, TYPE, titleTracking } from "./_shared/primitives";

// A phased roadmap on a rising timeline, marking where the client is today.
// Each bar rests on the rule of its own column, which carries the price, name
// and description.
export const roadmapPhases: TemplateDef = {
  id: "roadmap-phases",
  name: "Roadmap · phases",
  description: "A phased roadmap on a rising timeline, marking where the client is today.",
  tags: ["roadmap", "phases", "rollout", "timeline", "future", "wider", "sequence"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "04 · THE IMPACT" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    {
      key: "phases",
      type: "list",
      label: "Phases",
      itemLabel: "Phase",
      maxItems: 4,
      itemFields: [
        { key: "name", type: "text", label: "Name", maxLength: 28 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 120 },
        { key: "price", type: "text", label: "Price", maxLength: 24 },
        { key: "flag", type: "text", label: "Flag (e.g. YOU ARE HERE)", maxLength: 16 },
      ],
    },
    { key: "footnote", type: "textarea", label: "Footnote", maxLength: 160 },
  ],
  defaults: () => ({
    kicker: "04 · THE IMPACT",
    title: "The wider roadmap",
    phases: [
      { name: "Discovery", desc: "Invoice approval automation. The pilot, this proposal.", price: "€6,000", flag: "YOU ARE HERE" },
      { name: "Phase 1", desc: "The next 2–3 procurement automations from your roadmap.", price: "€3,000–€8,000 each", flag: "" },
      { name: "Phase 2", desc: "Source-to-pay, CLM and ERP integration across the workflows.", price: "Scoped per build", flag: "" },
      { name: "Phase 3+", desc: "Once procurement is proven, extend into finance, legal and ops.", price: "Discussed at Phase 2", flag: "" },
    ],
    footnote: "Phase 1 is the wedge. No commitment beyond it is being asked for here. Later phases are indicative.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const phases = rows(f.phases);
    const n = Math.max(phases.length, 1);
    // The chart band flexes to whatever height the descriptions leave, so bars
    // are sized as a fraction of it. BAR_MIN was 0.62, which made the tallest
    // bar only 1.6× the shortest — the rise barely read as a rise. At 0.34 the
    // last phase is roughly 3× the first. FLAG_H is held back from every bar so
    // the tallest still clears its flag pill, whichever phase carries it.
    const BAR_MIN = 0.34;
    const FLAG_H = 56;
    const cols = `repeat(${n}, 1fr)`;
    const hasPrice = phases.some((p) => !!p.price);
    const wash =
      ctx.background === "cream"
        ? "var(--coral-wash)"
        : ctx.background === "dark"
          ? "var(--ink-raised)"
          : "var(--on-coral-panel)";
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />

        <div
          style={{
            marginTop: "var(--s7)",
            flex: 1,
            minHeight: 220,
            maxHeight: 420,
            display: "grid",
            gridTemplateColumns: cols,
            gap: "var(--s5)",
          }}
        >
          {phases.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {p.flag && (
                <div style={{ alignSelf: "flex-start", marginBottom: 16 }}>
                  {/* Was 15px — the second-smallest type in the library, and
                      unreadable projected. */}
                  <Pill tone={t} size={TYPE.kickerSm - 4}>
                    {p.flag}
                  </Pill>
                </div>
              )}
              <div
                style={{
                  height: `calc((100% - ${FLAG_H}px) * ${BAR_MIN + ((1 - BAR_MIN) * i) / Math.max(n - 1, 1)})`,
                  borderRadius: "16px 16px 0 0",
                  background: p.flag ? t.accent : wash,
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "0 0 22px 28px",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: TYPE.h3,
                  lineHeight: 1,
                  letterSpacing: titleTracking(TYPE.h3),
                  color: p.flag ? t.onAccent : t.accent,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: cols, gap: "var(--s5)" }}>
          {phases.map((p, i) => (
            <div key={i}>
              <Rule tone={t} />
              <div style={{ paddingTop: 22 }}>
                {hasPrice && (
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: TYPE.kickerSm - 2,
                      lineHeight: "24px",
                      height: 24,
                      letterSpacing: 1.5,
                      color: t.accent,
                    }}
                  >
                    {p.price}
                  </div>
                )}
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h6,
                    letterSpacing: titleTracking(TYPE.h6),
                    marginTop: hasPrice ? 12 : 0,
                    color: t.title,
                  }}
                >
                  {p.name}
                </div>
                <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "12px 0 0" }}>
                  {p.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
        {str(f.footnote) && (
          <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "auto 0 0", paddingTop: 36 }}>
            {str(f.footnote)}
          </p>
        )}
      </Stage>
    );
  },
};
