import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Rule, Mark, tone, TYPE, titleTracking } from "./_shared/primitives";

// A feature matrix: capability rows against up to three options, with one
// column promoted. The deck had no tabular archetype at all, so any comparison
// had to be flattened into prose or into two unrelated cards.
//
// The ✓ / — marks are SVG rather than glyphs, because any character outside
// Poppins / Open Sans / JetBrains Mono is silently coerced to Open Sans on
// export — where it may not exist.
export const comparisonTable: TemplateDef = {
  id: "comparison-table",
  name: "Comparison table",
  description: "A feature matrix comparing two or three options across capability rows.",
  tags: ["comparison", "table", "matrix", "versus", "options", "features", "evaluation", "vendors"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "rowLabel", type: "text", label: "Row-header label", maxLength: 24, placeholder: "CAPABILITY" },
    { key: "colA", type: "text", label: "Column A", maxLength: 22 },
    { key: "colB", type: "text", label: "Column B", maxLength: 22 },
    { key: "colC", type: "text", label: "Column C", maxLength: 22, hint: "Leave blank for two columns" },
    {
      key: "featured",
      type: "select",
      label: "Recommended column",
      options: [
        { value: "none", label: "None" },
        { value: "a", label: "Column A" },
        { value: "b", label: "Column B" },
        { value: "c", label: "Column C" },
      ],
    },
    {
      key: "capabilities",
      type: "list",
      label: "Rows",
      itemLabel: "Row",
      maxItems: 6,
      itemFields: [
        { key: "label", type: "text", label: "Capability", maxLength: 44 },
        { key: "a", type: "text", label: "A", maxLength: 16, hint: "\"yes\", \"no\", or short text" },
        { key: "b", type: "text", label: "B", maxLength: 16 },
        { key: "c", type: "text", label: "C", maxLength: 16 },
      ],
    },
    { key: "footnote", type: "textarea", label: "Footnote", maxLength: 140 },
  ],
  defaults: () => ({
    kicker: "07 · WHY SOCH",
    title: "What you get, [[compared]]",
    rowLabel: "CAPABILITY",
    colA: "In-house",
    colB: "Generalist agency",
    colC: "Soch",
    featured: "c",
    capabilities: [
      { label: "Automation engineering depth", a: "no", b: "no", c: "yes" },
      { label: "Runs on your own stack", a: "yes", b: "no", c: "yes" },
      { label: "Fixed price before build", a: "no", b: "no", c: "yes" },
      { label: "Runbook and handover", a: "no", b: "yes", c: "yes" },
      { label: "Time to first automation", a: "6 mo", b: "3 mo", c: "8 wks" },
    ],
    footnote: "In-house assumes hiring an automation engineer. Timings are from signature to a live workflow.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const caps = rows(f.capabilities);
    const cols = [
      { key: "a" as const, name: str(f.colA) },
      { key: "b" as const, name: str(f.colB) },
      { key: "c" as const, name: str(f.colC) },
    ].filter((c) => c.name);
    const featured = str(f.featured, "none");
    const grid = `minmax(0, 1.6fr) repeat(${Math.max(cols.length, 1)}, minmax(0, 1fr))`;

    // "yes"/"no" become marks; anything else is set as short text, so a row can
    // carry a duration or a tier name instead of a tick.
    const cell = (raw: string | undefined, on: boolean) => {
      const v = (raw ?? "").trim().toLowerCase();
      if (v === "yes" || v === "y" || v === "true")
        return <Mark kind="yes" size={30} color={on ? t.onAccent : t.accent} />;
      if (v === "no" || v === "n" || v === "false" || v === "-")
        return <Mark kind="no" size={30} color={on ? t.onAccent : t.muted} />;
      return (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: TYPE.bodySm,
            letterSpacing: 1,
            fontWeight: 600,
            color: on ? t.onAccent : t.title,
          }}
        >
          {raw}
        </span>
      );
    };

    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />

        <div style={{ marginTop: "var(--s6)", flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {/* Header row */}
          <div style={{ display: "grid", gridTemplateColumns: grid, alignItems: "end", paddingBottom: 20 }}>
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: TYPE.kickerSm,
                letterSpacing: 3,
                fontWeight: 600,
                color: t.muted,
              }}
            >
              {str(f.rowLabel)}
            </div>
            {cols.map((c) => {
              const on = featured === c.key;
              return (
                <div
                  key={c.key}
                  style={{
                    textAlign: "center",
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h6 - 2,
                    letterSpacing: titleTracking(TYPE.h6),
                    color: on ? t.accent : t.title,
                  }}
                >
                  {c.name}
                </div>
              );
            })}
          </div>
          <Rule tone={t} weight="1" color={t.ruleStrong} />

          {caps.map((row, i) => (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: grid,
                alignItems: "center",
                flex: 1,
                minHeight: 0,
                borderBottom: `var(--rule-hair) solid ${t.rule}`,
              }}
            >
              <div style={{ fontSize: TYPE.body, color: t.bodyStrong, paddingRight: 24 }}>{row.label}</div>
              {cols.map((c) => {
                const on = featured === c.key;
                return (
                  <div
                    key={c.key}
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      // The recommended column is a continuous vertical field
                      // running the height of the table, not a per-cell tint.
                      background: on ? t.accent : "transparent",
                    }}
                  >
                    {cell(row[c.key], on)}
                  </div>
                );
              })}
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
