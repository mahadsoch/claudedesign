import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Rule, Stat, Pill, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// A framing point on the left, one hero figure on the right.
//
// This slide used to be a `display:flex` wrapper around a single `flex:1`
// child, with the body clamped to 640px and the figure label to 420px — so the
// right half of the stage was empty by accident rather than by intent. It is
// now a real two-column layout: narrative left, figure right, on a shared rule.
export const quadrantHighlight: TemplateDef = {
  id: "quadrant-highlight",
  name: "Highlight + hero stat",
  description: "A point with supporting tag pills beside one hero figure.",
  tags: ["highlight", "stat", "figure", "metric", "point"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 44 },
    { key: "title", type: "textarea", label: "Title", maxLength: 40, hint: "Wrap accent in [[…]]" },
    { key: "body", type: "textarea", label: "Body", maxLength: 160 },
    { key: "tagsLabel", type: "text", label: "Tags label", maxLength: 24 },
    {
      key: "tags",
      type: "list",
      label: "Tags",
      itemLabel: "Tag",
      maxItems: 4,
      itemFields: [{ key: "text", type: "text", label: "Tag", maxLength: 22 }],
    },
    { key: "figure", type: "text", label: "Hero figure", maxLength: 8, placeholder: "4/5" },
    { key: "figureLabel", type: "textarea", label: "Figure label", maxLength: 60 },
  ],
  defaults: () => ({
    kicker: "WHERE MOST TEAMS ARE TODAY",
    title: "Quadrant three.",
    body: "Disconnected tools. Manual work. One-off AI experiments that never scale.",
    tagsLabel: "WHAT IT COSTS",
    tags: [{ text: "Lost context" }, { text: "Duplicated effort" }, { text: "Pilots that stall" }],
    figure: "4/5",
    figureLabel: "companies we audit start here.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const tags = rows(f.tags);
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "100px var(--pad-x) 70px", display: "flex", gap: 110 }}
      >
        <div style={{ flex: 1.25, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Kicker>{str(f.kicker)}</Kicker>
          <h2
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.h1,
              letterSpacing: titleTracking(TYPE.h1),
              lineHeight: 1.05,
              margin: "32px 0 0",
              color: t.title,
            }}
          >
            {parseAccents(str(f.title))}
          </h2>
          <p style={{ fontSize: TYPE.h6, lineHeight: 1.55, color: t.body, margin: "36px 0 0" }}>
            {str(f.body)}
          </p>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 20 }}>
            {str(f.tagsLabel) && (
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: TYPE.kicker,
                  letterSpacing: 4,
                  color: t.muted,
                }}
              >
                {str(f.tagsLabel)}
              </div>
            )}
            <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
              {tags.map((tag, i) => (
                <Pill key={i} tone={t} variant="outline" size={TYPE.kickerSm}>
                  {tag.text}
                </Pill>
              ))}
            </div>
          </div>
        </div>

        {/* The figure now occupies the right column instead of hanging off the
            bottom of a half-empty stage. */}
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <Rule tone={t} weight="1" color={t.ruleStrong} style={{ marginBottom: 36 }} />
          <Stat value={str(f.figure)} size={TYPE.statMd + 40} color={t.accent} />
          <p style={{ fontSize: TYPE.h6 - 2, lineHeight: 1.4, color: t.body, margin: "28px 0 0", maxWidth: 520 }}>
            {str(f.figureLabel)}
          </p>
        </div>
      </Stage>
    );
  },
};
