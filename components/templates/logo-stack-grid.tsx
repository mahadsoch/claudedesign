import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, ImageBox, Rule, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// A ruled logo wall rather than a grid of identical boxes. Cells are separated
// by hairlines on a shared grid, so a row that does not divide evenly reads as
// a wall with space in it instead of as missing cards — and a logo with no
// image falls back to its own name set in mono, not to a dashed placeholder.
export const logoStackGrid: TemplateDef = {
  id: "logo-stack-grid",
  name: "Logo / tool wall",
  description: "A wall of logos or tools — your stack, integrations, or client roster.",
  tags: ["logos", "tools", "stack", "integrations", "clients"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 70, hint: "Wrap accent in [[…]]" },
    { key: "caption", type: "textarea", label: "Caption", maxLength: 120 },
    {
      key: "logos",
      type: "list",
      label: "Logos",
      itemLabel: "Logo",
      maxItems: 12,
      itemFields: [
        { key: "image", type: "image", label: "Logo image" },
        { key: "name", type: "text", label: "Name", maxLength: 20 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "THE STACK PROBLEM",
    title: "You have more tools than you can [[keep track of.]]",
    caption: "Every tool adds context that lives in a different place. None of them talk to each other.",
    logos: [
      { image: "", name: "Slack" },
      { image: "", name: "Notion" },
      { image: "", name: "Asana" },
      { image: "", name: "Drive" },
      { image: "", name: "Figma" },
      { image: "", name: "Sheets" },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const logos = rows(f.logos);
    // A fixed column count reads as a wall. `ceil(sqrt(n))` produced awkward
    // shapes — seven logos became three columns with two gaps.
    const cols = logos.length <= 4 ? Math.max(logos.length, 1) : logos.length <= 8 ? 4 : 6;
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <Kicker>{str(f.kicker)}</Kicker>
        <h2
          style={{
            fontFamily: "var(--font-title)",
            fontWeight: 600,
            fontSize: TYPE.h3,
            letterSpacing: titleTracking(TYPE.h3),
            lineHeight: 1.08,
            margin: "24px 0 0",
            maxWidth: 1400,
            color: t.title,
          }}
        >
          {parseAccents(str(f.title))}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            marginTop: "var(--s6)",
            flex: 1,
            minHeight: 0,
            alignContent: "center",
          }}
        >
          {logos.map((l, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                padding: "34px 24px",
                // Hairlines on two edges build one continuous grid.
                borderTop: `var(--rule-hair) solid ${t.rule}`,
                borderLeft: i % cols === 0 ? "none" : `var(--rule-hair) solid ${t.rule}`,
                minHeight: 158,
                boxSizing: "border-box",
              }}
            >
              {str(l.image) ? (
                <div style={{ width: 72, height: 72 }}>
                  <ImageBox src={ctx.resolveImage(str(l.image))} radius={14} tone={t} />
                </div>
              ) : null}
              {l.name && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: str(l.image) ? TYPE.kickerSm : TYPE.h6 - 4,
                    letterSpacing: str(l.image) ? 1 : 2,
                    fontWeight: str(l.image) ? 400 : 600,
                    textTransform: str(l.image) ? "none" : "uppercase",
                    color: str(l.image) ? t.body : t.title,
                    textAlign: "center",
                  }}
                >
                  {l.name}
                </div>
              )}
            </div>
          ))}
        </div>
        <Rule tone={t} style={{ marginTop: 0 }} />
        {str(f.caption) && (
          <p style={{ fontSize: TYPE.h6 - 2, lineHeight: 1.5, color: t.body, margin: "36px 0 0", maxWidth: 1100 }}>
            {str(f.caption)}
          </p>
        )}
      </Stage>
    );
  },
};
