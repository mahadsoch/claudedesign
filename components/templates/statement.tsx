import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, Rule, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// The anchor moment. Previously this was a kicker and a title floating in the
// middle of the stage with nothing else on it. It now composes: a ghost mark
// bleeding off the right edge, a heavy accent rule, and type anchored to the
// bottom-left so the slide has a corner to sit in.
export const statement: TemplateDef = {
  id: "statement",
  name: "Statement",
  description: "A single large statement carrying the whole slide — a bold anchor moment.",
  tags: ["statement", "manifesto", "thesis", "anchor", "section"],
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "statement", type: "textarea", label: "Statement", maxLength: 130, hint: "Wrap the accent in [[…]]" },
    { key: "footnote", type: "text", label: "Footnote", maxLength: 90 },
    {
      key: "ghost",
      type: "text",
      label: "Ghost mark",
      maxLength: 4,
      placeholder: "01",
      hint: "Set oversized behind the type, bleeding off the right edge. Leave blank for none.",
    },
    {
      key: "align",
      type: "select",
      label: "Alignment",
      options: [
        { value: "anchor", label: "Anchored bottom-left" },
        { value: "centre", label: "Centred" },
      ],
    },
  ],
  defaults: () => ({
    kicker: "THE ONE THING TO REMEMBER",
    statement: "Layering AI onto a broken system [[will never work.]]",
    footnote: "",
    ghost: "",
    align: "anchor",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const centred = str(f.align, "anchor") === "centre";
    const ghost = str(f.ghost);
    return (
      <Stage
        background={ctx.background}
        style={{
          padding: "var(--pad-y) var(--pad-x) 96px",
          display: "flex",
          flexDirection: "column",
          justifyContent: centred ? "center" : "flex-start",
        }}
      >
        {/* Ghost mark — oversized, low-opacity, running off the right edge. The
            one piece of the slide that is texture rather than content. */}
        {ghost && (
          <div
            style={{
              position: "absolute",
              right: -60,
              bottom: -110,
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: 560,
              lineHeight: 0.8,
              letterSpacing: -24,
              color: t.title,
              opacity: 0.07,
              pointerEvents: "none",
            }}
          >
            {ghost}
          </div>
        )}

        <Kicker style={{ position: "relative" }}>{str(f.kicker)}</Kicker>

        <div style={{ marginTop: centred ? 48 : "auto", position: "relative" }}>
          {!centred && <Rule tone={t} weight="heavy" color={t.accent} length={200} style={{ marginBottom: 48 }} />}
          <h1
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.h1 + 24,
              lineHeight: 1.06,
              letterSpacing: titleTracking(TYPE.h1 + 24),
              margin: 0,
              maxWidth: 1560,
              color: t.title,
            }}
          >
            {parseAccents(str(f.statement))}
          </h1>
          {str(f.footnote) && (
            <p style={{ fontSize: TYPE.bodySm + 2, lineHeight: 1.5, color: t.muted, margin: "40px 0 0", maxWidth: 1100 }}>
              {str(f.footnote)}
            </p>
          )}
        </div>
      </Stage>
    );
  },
};
