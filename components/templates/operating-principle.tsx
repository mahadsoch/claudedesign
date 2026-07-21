import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker } from "./_shared/primitives";

export const operatingPrinciple: TemplateDef = {
  id: "operating-principle",
  name: "Operating principle",
  description: "Stacked principle rows on coral — how you operate, in a few lines.",
  tags: ["principles", "values", "how we work", "operating", "approach"],
  background: "coral",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 44 },
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
    rows: [
      { stage: "DAY ONE", line: "Verify, then trust." },
      { stage: "ONCE EARNED", line: "Trust, then verify." },
      { stage: "WHEN IT SHIFTS", line: "Readjust. Verify. Trust." },
    ],
  }),
  render: (f) => {
    const list = rows(f.rows);
    return (
      <Stage
        background="coral"
        style={{ padding: "100px 120px 90px", display: "flex", flexDirection: "column", justifyContent: "center" }}
      >
        <Kicker color="var(--cream)" style={{ opacity: 0.85 }}>
          {str(f.kicker)}
        </Kicker>
        <div style={{ display: "flex", flexDirection: "column", gap: 40, marginTop: 68 }}>
          {list.map((r, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 40 }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 40 }}>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 26,
                    letterSpacing: 2,
                    minWidth: 210,
                    opacity: 0.8,
                  }}
                >
                  {r.stage}
                </div>
                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 80, letterSpacing: -2.5, lineHeight: 1.05 }}>
                  {r.line}
                </div>
              </div>
              {i < list.length - 1 && <div style={{ height: 2, background: "rgba(252,245,235,0.35)" }} />}
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
