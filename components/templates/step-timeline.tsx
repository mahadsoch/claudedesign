import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead } from "./_shared/primitives";

// "From review to kickoff": a horizontal numbered timeline of next steps, each
// a node on a connecting rule with a title and a one-line description.
export const stepTimeline: TemplateDef = {
  id: "step-timeline",
  name: "Steps · timeline",
  description: "A horizontal numbered timeline of next steps, each with a title and one line.",
  tags: ["steps", "next steps", "timeline", "process", "kickoff", "path", "sequence"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "08 · NEXT STEPS" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "subtitle", type: "text", label: "Subtitle", maxLength: 40, placeholder: "THE PATH FROM HERE" },
    {
      key: "steps",
      type: "list",
      label: "Steps",
      itemLabel: "Step",
      maxItems: 5,
      itemFields: [
        { key: "title", type: "text", label: "Title", maxLength: 30 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 90 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "08 · NEXT STEPS",
    title: "From review to kickoff",
    subtitle: "THE PATH FROM HERE",
    steps: [
      { title: "Review internally", desc: "Read this proposal and flag anything to adjust." },
      { title: "Confirm the metric", desc: "Agree the success metric for the pilot." },
      { title: "Clear procurement", desc: "Confirm vendor, NDA, DPA and access steps." },
      { title: "Sign Discovery", desc: "Soch sends the Discovery contract for signature." },
      { title: "Kick off", desc: "Discovery begins the week after signing." },
    ],
  }),
  render: (f) => {
    const steps = rows(f.steps);
    const n = Math.max(steps.length, 1);
    return (
      <Stage background="cream" style={{ padding: "90px 130px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        {str(f.subtitle) && (
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: 3, fontWeight: 600, color: "var(--warm-gray)", marginTop: 40 }}>
            {str(f.subtitle)}
          </div>
        )}
        <div style={{ marginTop: 40, flex: 1, position: "relative", display: "grid", gridTemplateColumns: `repeat(${n}, 1fr)`, gap: 40, alignContent: "start" }}>
          <div style={{ position: "absolute", top: 26, left: 0, right: 0, height: 1, background: "var(--card-border)" }} />
          {steps.map((s, i) => (
            <div key={i} style={{ position: "relative", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
                <span style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 44, color: "var(--coral)", letterSpacing: -1, lineHeight: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
              </div>
              <div style={{ width: 12, height: 12, borderRadius: 9999, background: "var(--coral)", marginTop: 20, marginBottom: 26 }} />
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 27, letterSpacing: -0.5 }}>{s.title}</div>
              <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "12px 0 0" }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
