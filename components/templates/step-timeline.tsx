import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Track, Numeral, SlideFooter, tone, TYPE, titleTracking } from "./_shared/primitives";

// "From review to kickoff": a horizontal numbered timeline of next steps.
//
// The rail used to sit at top:26 — straight through the middle of the 44px
// numerals rather than through the nodes, and running past the last node with
// no terminator. The rail and its nodes are now one `Track` component whose
// nodes land on each column's left edge, above the numerals.
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
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const steps = rows(f.steps);
    const n = Math.max(steps.length, 1);
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 128px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />
        {str(f.subtitle) && (
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: TYPE.kickerSm,
              letterSpacing: 3,
              fontWeight: 600,
              color: t.muted,
              marginTop: "var(--s5)",
            }}
          >
            {str(f.subtitle)}
          </div>
        )}

        {/* Content fills the remaining height rather than floating at the top,
            which used to leave a ~350px void beneath a five-step timeline. */}
        <div style={{ marginTop: "var(--s5)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <Track count={n} tone={t} align="start" node={16} />
          <div
            style={{
              marginTop: "var(--s4)",
              display: "grid",
              gridTemplateColumns: `repeat(${n}, 1fr)`,
              gap: 40,
              flex: 1,
              minHeight: 0,
            }}
          >
            {steps.map((s, i) => (
              <div key={i} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
                <Numeral n={i + 1} tone={t} size={TYPE.h4 - 6} />
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h6 - 3,
                    letterSpacing: titleTracking(TYPE.h6),
                    marginTop: 22,
                    color: t.title,
                  }}
                >
                  {s.title}
                </div>
                <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "12px 0 0" }}>
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
        <SlideFooter tone={t} slideNumber={ctx.slideNumber} slideCount={ctx.slideCount} />
      </Stage>
    );
  },
};
