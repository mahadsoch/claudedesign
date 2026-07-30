import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead } from "./_shared/primitives";

// The "wider roadmap" slide: a rising bar per phase (one flagged
// "YOU ARE HERE"), each sitting directly on the rule of its column, which
// carries the price/label, name and description.
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
  render: (f) => {
    const phases = rows(f.phases);
    const n = Math.max(phases.length, 1);
    // The chart band flexes to whatever height the descriptions leave, so the
    // bars are sized as a fraction of it: the last phase fills the band, the
    // first is BAR_MIN of it. FLAG_H is held back from every bar so the tallest
    // one still clears its flag pill — whichever phase carries it.
    const BAR_MIN = 0.62;
    const FLAG_H = 49;
    const cols = `repeat(${n}, 1fr)`;
    // Reserve the price row in every column once any phase has one, so the
    // names stay on one line across the row.
    const hasPrice = phases.some((p) => !!p.price);
    return (
      <Stage background="cream" style={{ padding: "90px 130px 70px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />

        {/* Ascending phase bars — each rests on the rule of its column below */}
        <div style={{ marginTop: 64, flex: 1, minHeight: 220, maxHeight: 420, display: "grid", gridTemplateColumns: cols, gap: 44 }}>
          {phases.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
              {p.flag && (
                <div style={{ alignSelf: "flex-start", background: "var(--coral)", color: "var(--cream)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, letterSpacing: 1.5, padding: "6px 14px", borderRadius: 999, whiteSpace: "nowrap", marginBottom: 16 }}>
                  {p.flag}
                </div>
              )}
              <div
                style={{
                  height: `calc((100% - ${FLAG_H}px) * ${BAR_MIN + ((1 - BAR_MIN) * i) / Math.max(n - 1, 1)})`,
                  borderRadius: "16px 16px 0 0",
                  background: p.flag ? "var(--coral)" : "var(--coral-wash)",
                  overflow: "hidden",
                  display: "flex",
                  alignItems: "flex-end",
                  padding: "0 0 22px 28px",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: 60,
                  lineHeight: 1,
                  letterSpacing: -2,
                  color: p.flag ? "var(--cream)" : "var(--coral)",
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: cols, gap: 44 }}>
          {phases.map((p, i) => (
            <div key={i} style={{ borderTop: "1px solid var(--card-border)", paddingTop: 22 }}>
              {hasPrice && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, lineHeight: "24px", height: 24, letterSpacing: 1.5, color: "var(--coral)" }}>{p.price}</div>
              )}
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 30, letterSpacing: -0.5, marginTop: hasPrice ? 12 : 0 }}>{p.name}</div>
              <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "12px 0 0" }}>{p.desc}</p>
            </div>
          ))}
        </div>
        {str(f.footnote) && (
          <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "auto 0 0", paddingTop: 36 }}>{str(f.footnote)}</p>
        )}
      </Stage>
    );
  },
};
