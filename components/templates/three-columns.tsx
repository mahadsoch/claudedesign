import { Fragment } from "react";
import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, IconChip, Numeral, Rule, tone, TYPE, titleTracking } from "./_shared/primitives";

// Three parallel points separated by real vertical rules, each with a mono
// index, an icon chip, a heading and a paragraph.
export const threeColumns: TemplateDef = {
  id: "three-columns",
  name: "Three columns",
  description: "Three parallel points side by side, each with an icon, heading and short paragraph.",
  tags: ["columns", "problem", "three", "points", "reasons", "pillars"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "02 · THE PROBLEM" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    {
      key: "emphasis",
      type: "select",
      label: "Column weights",
      options: [
        { value: "lead", label: "First column leads (asymmetric)" },
        { value: "equal", label: "Equal columns" },
      ],
    },
    {
      key: "columns",
      type: "list",
      label: "Columns",
      itemLabel: "Column",
      maxItems: 3,
      itemFields: [
        { key: "icon", type: "image", label: "Icon", picker: "icon" },
        { key: "head", type: "text", label: "Heading", maxLength: 40 },
        { key: "body", type: "textarea", label: "Body", maxLength: 200 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "02 · THE PROBLEM",
    title: "A working prototype is not yet a foundation",
    emphasis: "lead",
    columns: [
      { icon: "icon:bolt", head: "Built reactively", body: "The current flow was assembled as a basic MVP. Edge cases and failure paths were not designed in." },
      { icon: "icon:gear", head: "No engineering depth yet", body: "It was built solo, through trial and error. There is no specialist automation engineering behind it." },
      { icon: "icon:warning", head: "Fragile under the roadmap", body: "Fifteen workflows are meant to sit on top of this. Today its failures are silent." },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const cols = rows(f.columns);
    const lead = str(f.emphasis, "lead") === "lead";
    return (
      <Stage background={ctx.background} style={{ display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />
        {/* Rules are rendered *between* columns rather than as a left border on
            each. The border approach gave column one a different text measure
            from the rest and left an inset that did not match the page margin. */}
        <div style={{ marginTop: "var(--s7)", flex: 1, display: "flex", gap: "var(--s7)", minHeight: 0 }}>
          {cols.map((c, i) => (
            <Fragment key={i}>
              {i > 0 && <Rule tone={t} vertical />}
              <div
                style={{
                  flex: lead && i === 0 ? 1.4 : 1,
                  minWidth: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "var(--s3)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "var(--s3)" }}>
                  <IconChip value={str(c.icon)} resolve={ctx.resolveImage} tone={t} size={64} />
                  <Numeral n={i + 1} tone={t} size={TYPE.h6} color={t.muted} />
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: lead && i === 0 ? TYPE.h4 - 6 : TYPE.h5,
                    letterSpacing: titleTracking(TYPE.h5),
                    lineHeight: 1.15,
                    color: t.title,
                  }}
                >
                  {c.head}
                </div>
                <p style={{ fontSize: TYPE.body, lineHeight: 1.5, color: t.body, margin: 0 }}>{c.body}</p>
              </div>
            </Fragment>
          ))}
        </div>
      </Stage>
    );
  },
};
