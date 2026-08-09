import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Track, Numeral, Rule, tone, TYPE, titleTracking } from "./_shared/primitives";

// A phased engagement laid out as connected stages: a continuous rail with a
// node per stage, then a big index, a duration, a title, a description and a
// price, each capped by a rule at a shared baseline.
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
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const stages = rows(f.stages);
    const n = Math.max(stages.length, 1);
    // A single stage would otherwise render as one 1680px-wide column.
    const cols = n === 1 ? "minmax(0, 720px)" : `repeat(${n}, 1fr)`;
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />

        {/* The connective tissue the slide was missing: stages now read as one
            sequence rather than as four unrelated columns. */}
        {n > 1 && <Track count={n} tone={t} align="start" style={{ marginTop: "var(--s6)" }} />}

        <div
          style={{
            marginTop: "var(--s5)",
            flex: 1,
            display: "grid",
            gridTemplateColumns: cols,
            gap: "var(--s5)",
            minHeight: 0,
          }}
        >
          {stages.map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              <Numeral n={i + 1} tone={t} size={TYPE.h3} />
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: TYPE.kickerSm,
                  letterSpacing: 3,
                  fontWeight: 600,
                  color: t.accent,
                  margin: "18px 0 14px",
                }}
              >
                {s.duration}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: TYPE.h6,
                  letterSpacing: titleTracking(TYPE.h6),
                  color: t.title,
                }}
              >
                {s.name}
              </div>
              <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "14px 0 0", flex: 1 }}>
                {s.desc}
              </p>
              {s.price && (
                <>
                  <Rule tone={t} style={{ marginTop: 22 }} />
                  <div
                    style={{
                      fontFamily: "var(--font-title)",
                      fontWeight: 600,
                      fontSize: TYPE.bodySm,
                      paddingTop: 18,
                      color: t.title,
                    }}
                  >
                    {s.price}
                  </div>
                </>
              )}
            </div>
          ))}
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
