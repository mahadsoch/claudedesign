import { Fragment } from "react";
import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Rule, Numeral, tone, TYPE, titleTracking } from "./_shared/primitives";

export const operatingPrinciple: TemplateDef = {
  id: "operating-principle",
  name: "Operating principle",
  description: "Stacked principle rows — how you operate, in a few lines.",
  tags: ["principles", "values", "how we work", "operating", "approach"],
  background: "coral",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 44 },
    // Previously there was no title at all — only a kicker, which left the
    // slide without a proper head.
    { key: "title", type: "text", label: "Title", maxLength: 44, hint: "Optional" },
    {
      key: "rows",
      type: "list",
      label: "Principles",
      itemLabel: "Row",
      maxItems: 4,
      itemFields: [
        { key: "stage", type: "text", label: "Stage label", maxLength: 20, placeholder: "DAY ONE" },
        { key: "line", type: "text", label: "Principle", maxLength: 36, placeholder: "Verify, then trust." },
      ],
    },
  ],
  defaults: () => ({
    kicker: "THE OPERATING PRINCIPLE FOR AI",
    title: "",
    rows: [
      { stage: "DAY ONE", line: "Verify, then trust." },
      { stage: "ONCE EARNED", line: "Trust, then verify." },
      { stage: "WHEN IT SHIFTS", line: "Readjust. Verify. Trust." },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const list = rows(f.rows);
    return (
      <Stage
        background={ctx.background}
        style={{
          padding: "100px var(--pad-x) 90px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <Kicker color={t.title} style={{ opacity: 0.85 }}>
          {str(f.kicker)}
        </Kicker>
        {str(f.title) && (
          <h2
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.h4,
              letterSpacing: titleTracking(TYPE.h4),
              margin: "24px 0 0",
              color: t.title,
            }}
          >
            {str(f.title)}
          </h2>
        )}
        <div style={{ display: "flex", flexDirection: "column", marginTop: 68 }}>
          {list.map((r, i) => (
            <Fragment key={i}>
              {/* Tighter above the rule than below, so each rule groups with the
                  row it closes instead of floating equidistant between two. */}
              <div style={{ display: "flex", alignItems: "baseline", gap: 40, paddingBottom: 26 }}>
                <Numeral n={i + 1} tone={t} size={TYPE.bodySm} color={t.title} style={{ opacity: 0.65 }} />
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: TYPE.body,
                    letterSpacing: 2,
                    minWidth: 210,
                    color: t.title,
                    opacity: 0.8,
                  }}
                >
                  {r.stage}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h2 + 8,
                    letterSpacing: titleTracking(TYPE.h2 + 8),
                    lineHeight: 1.05,
                    color: t.title,
                  }}
                >
                  {r.line}
                </div>
              </div>
              {i < list.length - 1 && <Rule tone={t} weight="1" style={{ marginBottom: 44 }} />}
            </Fragment>
          ))}
        </div>
      </Stage>
    );
  },
};
