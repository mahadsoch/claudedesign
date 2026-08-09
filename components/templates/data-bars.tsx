import type { TemplateDef } from "./types";
import { str, rows, numOf } from "./types";
import { Stage, SectionHead, Meter, Rule, Stat, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// A real bar chart. Until now every number in the deck was typed text — there
// was no way to show magnitude at all.
//
// The bars are plain divs, so they export as NATIVE, editable PowerPoint
// rectangles rather than as a flattened picture. Bar length is derived from the
// number inside the value the audience reads, so the chart cannot disagree with
// its own label.
export const dataBars: TemplateDef = {
  id: "data-bars",
  name: "Data · bar chart",
  description: "Compare a few quantities as horizontal bars — shares, volumes, or a ranking.",
  tags: ["chart", "data", "bars", "graph", "compare", "breakdown", "share", "ranking", "metrics"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    {
      key: "bars",
      type: "list",
      label: "Bars",
      itemLabel: "Bar",
      maxItems: 6,
      itemFields: [
        { key: "label", type: "text", label: "Label", maxLength: 34 },
        { key: "value", type: "text", label: "Value", maxLength: 10, placeholder: "62%", hint: "The bar length is read from this number" },
        {
          key: "emphasis",
          type: "select",
          label: "Emphasis",
          options: [
            { value: "no", label: "Standard" },
            { value: "yes", label: "Highlight (accent)" },
          ],
        },
      ],
    },
    { key: "source", type: "text", label: "Source", maxLength: 50, placeholder: "SOURCE · INTERNAL AUDIT" },
    { key: "takeaway", type: "textarea", label: "Takeaway", maxLength: 120, hint: "Wrap accent in [[…]]" },
  ],
  defaults: () => ({
    kicker: "WHERE THE TIME GOES",
    title: "Most of the week is [[coordination]]",
    bars: [
      { label: "Status & coordination", value: "62%", emphasis: "yes" },
      { label: "Rework and duplication", value: "18%", emphasis: "no" },
      { label: "Admin and reporting", value: "12%", emphasis: "no" },
      { label: "The actual work", value: "8%", emphasis: "no" },
    ],
    source: "SOURCE · INTERNAL TIME AUDIT",
    takeaway: "Automation pays back fastest where the [[coordination cost]] is.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const bars = rows(f.bars);
    const max = Math.max(...bars.map((b) => Math.abs(numOf(str(b.value)))), 1);
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />

        <div
          style={{
            marginTop: "var(--s6)",
            flex: 1,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "var(--s4)",
            minHeight: 0,
          }}
        >
          {bars.map((b, i) => {
            const on = str(b.emphasis) === "yes";
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "var(--s5)" }}>
                <div
                  style={{
                    flex: "0 0 420px",
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h6 - 4,
                    letterSpacing: titleTracking(TYPE.h6),
                    color: on ? t.title : t.body,
                  }}
                >
                  {b.label}
                </div>
                <Meter
                  pct={Math.abs(numOf(str(b.value))) / max}
                  tone={t}
                  height={on ? 44 : 34}
                  // The unemphasised fill must read *darker* than its track, or
                  // the empty track is mistaken for the bar and every value
                  // looks larger than it is.
                  color={on ? t.accent : t.muted}
                  style={{ flex: 1 }}
                />
                <Stat
                  value={str(b.value)}
                  size={on ? TYPE.h4 : TYPE.h5 - 2}
                  color={on ? t.accent : t.title}
                  style={{ flex: "0 0 200px", textAlign: "right" }}
                />
              </div>
            );
          })}
        </div>

        <Rule tone={t} />
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--s5)", paddingTop: 24 }}>
          {str(f.takeaway) && (
            <p
              style={{
                flex: 1,
                fontFamily: "var(--font-title)",
                fontWeight: 500,
                fontSize: TYPE.h5 - 4,
                lineHeight: 1.4,
                margin: 0,
                color: t.title,
              }}
            >
              {parseAccents(str(f.takeaway))}
            </p>
          )}
          {str(f.source) && (
            <div
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: TYPE.kickerSm,
                letterSpacing: 2,
                color: t.muted,
              }}
            >
              {str(f.source)}
            </div>
          )}
        </div>
      </Stage>
    );
  },
};
