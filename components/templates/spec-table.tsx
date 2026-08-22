import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Rule, Pill, tone, TYPE, titleTracking } from "./_shared/primitives";

// A ledger: label, value, note. For scope lines, deliverables, assumptions,
// SLAs — anything that reads as a specification rather than as an argument.
export const specTable: TemplateDef = {
  id: "spec-table",
  name: "Spec · ledger table",
  description: "A ledger of label / value / note rows — scope, deliverables, assumptions or SLAs.",
  tags: ["table", "spec", "scope", "deliverables", "assumptions", "sla", "terms", "ledger", "summary"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "colLabel", type: "text", label: "Column 1 header", maxLength: 22, placeholder: "DELIVERABLE" },
    { key: "colValue", type: "text", label: "Column 2 header", maxLength: 22, placeholder: "WHEN" },
    { key: "colNote", type: "text", label: "Column 3 header", maxLength: 22, placeholder: "OWNER" },
    {
      key: "specs",
      type: "list",
      label: "Rows",
      itemLabel: "Row",
      maxItems: 7,
      itemFields: [
        { key: "label", type: "text", label: "Label", maxLength: 40 },
        { key: "value", type: "text", label: "Value", maxLength: 28 },
        { key: "note", type: "text", label: "Note", maxLength: 40 },
        { key: "tag", type: "text", label: "Tag", maxLength: 14, hint: "Optional pill, e.g. INCLUDED" },
      ],
    },
    { key: "footnote", type: "textarea", label: "Footnote", maxLength: 140 },
  ],
  defaults: () => ({
    kicker: "SCOPE AT A GLANCE",
    title: "What ships, and [[when]]",
    colLabel: "DELIVERABLE",
    colValue: "WHEN",
    colNote: "OWNER",
    specs: [
      { label: "Architecture memo", value: "End of week 2", note: "Soch", tag: "INCLUDED" },
      { label: "Evaluation plan", value: "End of week 3", note: "Soch + you", tag: "INCLUDED" },
      { label: "Hardened production flow", value: "Week 8", note: "Soch", tag: "INCLUDED" },
      { label: "Runbook & walkthrough", value: "Week 9", note: "Soch", tag: "INCLUDED" },
      { label: "Source-system integration", value: "Scoped later", note: "Joint", tag: "OPTIONAL" },
    ],
    footnote: "Dates are from signature. Anything marked optional is priced separately at Discovery.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const specs = rows(f.specs);
    const grid = "minmax(0, 1.5fr) minmax(0, 0.8fr) minmax(0, 0.7fr) auto";
    const head: React.CSSProperties = {
      fontFamily: "var(--font-mono)",
      fontSize: TYPE.kickerSm,
      letterSpacing: 3,
      fontWeight: 600,
      color: t.muted,
    };
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />

        <div style={{ marginTop: "var(--s6)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ display: "grid", gridTemplateColumns: grid, gap: "var(--s4)", paddingBottom: 18 }}>
            <div style={head}>{str(f.colLabel)}</div>
            <div style={head}>{str(f.colValue)}</div>
            <div style={head}>{str(f.colNote)}</div>
            <div />
          </div>
          <Rule tone={t} weight="1" color={t.ruleStrong} />

          {specs.map((s, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: grid,
                gap: "var(--s4)",
                alignItems: "center",
                flex: 1,
                minHeight: 0,
                borderBottom: `var(--rule-hair) solid ${t.rule}`,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: TYPE.h6 - 4,
                  letterSpacing: titleTracking(TYPE.h6),
                  color: t.title,
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: TYPE.body - 2, color: t.bodyStrong }}>{s.value}</div>
              <div style={{ fontSize: TYPE.body - 2, color: t.body }}>{s.note}</div>
              <div>{s.tag ? <Pill tone={t} variant="outline" size={14}>{s.tag}</Pill> : null}</div>
            </div>
          ))}
        </div>

        {str(f.footnote) && (
          <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "var(--s4) 0 0" }}>
            {str(f.footnote)}
          </p>
        )}
      </Stage>
    );
  },
};
