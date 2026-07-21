import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead } from "./_shared/primitives";

// A phased engagement laid out as horizontal stages: a big coral number, a
// duration, a title, a description and a price, each capped by a rule. The
// "four stages, scope fixed before build" slide.
export const processStages: TemplateDef = {
  id: "process-stages",
  name: "Process · stages",
  description: "A phased plan (up to 4 stages) with duration, description and price per stage.",
  tags: ["process", "stages", "phases", "timeline", "plan", "approach", "steps"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "03 · THE APPROACH" },
    { key: "title", type: "textarea", label: "Title", maxLength: 64, hint: "Wrap accent in [[…]]" },
    {
      key: "stages",
      type: "list",
      label: "Stages",
      itemLabel: "Stage",
      maxItems: 4,
      itemFields: [
        { key: "duration", type: "text", label: "Duration", maxLength: 20, placeholder: "2–3 WEEKS" },
        { key: "name", type: "text", label: "Name", maxLength: 28 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 150 },
        { key: "price", type: "text", label: "Price", maxLength: 24, placeholder: "€6,000 fixed" },
      ],
    },
    { key: "footnote", type: "textarea", label: "Footnote", maxLength: 160 },
  ],
  defaults: () => ({
    kicker: "03 · THE APPROACH",
    title: "Four stages, with scope fixed before Build",
    stages: [
      { duration: "2–3 WEEKS", name: "Discovery & Blueprint", desc: "Review the concept and the live tool. Interview stakeholders. Map failure modes.", price: "€6,000 fixed" },
      { duration: "6–8 WEEKS", name: "Pilot Build", desc: "Build and harden all four stages on your tenant. Backtest, then run in parallel.", price: "€15,000–€20,000" },
      { duration: "FINAL CYCLES", name: "Handover", desc: "Runbook and walkthrough. Knowledge transfer. The maintenance model is decided here.", price: "Included" },
      { duration: "OPTIONAL", name: "Scale & Support", desc: "Rollout across missions in waves, monitoring, and source-system integration.", price: "From €4,000 / block" },
    ],
    footnote: "Discovery is a fixed fee, credited against Build. It gives both sides certainty on scope and price.",
  }),
  render: (f) => {
    const stages = rows(f.stages);
    return (
      <Stage background="cream" style={{ padding: "90px 130px 70px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        <div style={{ marginTop: 56, flex: 1, display: "grid", gridTemplateColumns: `repeat(${Math.max(stages.length, 1)}, 1fr)`, gap: 44, minHeight: 0 }}>
          {stages.map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 58, color: "var(--coral)", letterSpacing: -2, lineHeight: 1 }}>
                {i + 1}
              </div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: 3, fontWeight: 600, color: "var(--coral)", margin: "18px 0 14px" }}>
                {s.duration}
              </div>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 28, letterSpacing: -0.5 }}>{s.name}</div>
              <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "14px 0 0", flex: 1 }}>{s.desc}</p>
              <div style={{ borderTop: "1px solid var(--card-border)", marginTop: 22, paddingTop: 18, fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 22 }}>
                {s.price}
              </div>
            </div>
          ))}
        </div>
        {str(f.footnote) && (
          <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "44px 0 0" }}>{str(f.footnote)}</p>
        )}
      </Stage>
    );
  },
};
