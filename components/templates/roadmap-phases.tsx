import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead } from "./_shared/primitives";

// The "wider roadmap" slide: an ascending timeline band with a marker per
// phase (one flagged "YOU ARE HERE"), then phase columns with a name,
// description and price below.
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
      { name: "Discovery", desc: "Invoice approval automation. The pilot, this proposal.", price: "€1,500", flag: "YOU ARE HERE" },
      { name: "Phase 1", desc: "The next 2–3 procurement automations from your roadmap.", price: "€3,000–€8,000 each", flag: "" },
      { name: "Phase 2", desc: "Source-to-pay, CLM and ERP integration across the workflows.", price: "Scoped per build", flag: "" },
      { name: "Phase 3+", desc: "Once procurement is proven, extend into finance, legal and ops.", price: "Discussed at Phase 2", flag: "" },
    ],
    footnote: "Phase 1 is the wedge. No commitment beyond it is being asked for here. Later phases are indicative.",
  }),
  render: (f) => {
    const phases = rows(f.phases);
    const n = Math.max(phases.length, 1);
    return (
      <Stage background="cream" style={{ padding: "90px 130px 70px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />

        {/* Ascending marker band */}
        <div style={{ position: "relative", height: 190, marginTop: 44, background: "var(--coral-wash)", borderRadius: 20 }}>
          {phases.map((p, i) => {
            const left = ((i + 0.5) / n) * 100;
            const bottom = 30 + (i / Math.max(n - 1, 1)) * 96;
            return (
              <div key={i} style={{ position: "absolute", left: `${left}%`, bottom, transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                {p.flag && (
                  <div style={{ background: "var(--coral)", color: "var(--cream)", fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 15, letterSpacing: 1.5, padding: "6px 14px", borderRadius: 999, whiteSpace: "nowrap" }}>
                    {p.flag}
                  </div>
                )}
                <div style={{ width: 20, height: 20, borderRadius: 9999, background: p.flag ? "var(--coral)" : "var(--ink)", border: "3px solid var(--cream)" }} />
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 36, flex: 1, display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 44, minHeight: 0 }}>
          {phases.map((p, i) => (
            <div key={i} style={{ borderTop: "1px solid var(--card-border)", paddingTop: 22, display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 30, letterSpacing: -0.5 }}>{p.name}</div>
              <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "12px 0 0", flex: 1 }}>{p.desc}</p>
              {p.price && <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, letterSpacing: 1, color: "var(--ink)", marginTop: 18 }}>{p.price}</div>}
            </div>
          ))}
        </div>
        {str(f.footnote) && (
          <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "36px 0 0" }}>{str(f.footnote)}</p>
        )}
      </Stage>
    );
  },
};
