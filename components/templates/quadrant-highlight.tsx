import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, parseAccents } from "./_shared/primitives";

export const quadrantHighlight: TemplateDef = {
  id: "quadrant-highlight",
  name: "Highlight + hero stat",
  description: "A point with supporting tag pills plus one hero figure below.",
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
  render: (f) => (
    <Stage background="cream" style={{ padding: "100px 120px 70px", display: "flex", gap: 110 }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        <Kicker>{str(f.kicker)}</Kicker>
        <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 88, letterSpacing: -2.5, lineHeight: 1.05, margin: "32px 0 0" }}>
          {parseAccents(str(f.title))}
        </h2>
        <p style={{ fontSize: 30, lineHeight: 1.55, color: "#4A4538", margin: "36px 0 0", maxWidth: 640 }}>{str(f.body)}</p>
        <div style={{ marginTop: 60, display: "flex", flexDirection: "column", gap: 20 }}>
          {str(f.tagsLabel) && (
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 4, color: "var(--warm-gray)" }}>{str(f.tagsLabel)}</div>
          )}
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap" }}>
            {rows(f.tags).map((t, i) => (
              <div key={i} style={{ fontSize: 25, fontWeight: 600, padding: "13px 28px", border: "1.5px solid var(--card-border)", borderRadius: 999, color: "#4A4538" }}>
                {t.text}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: "auto", borderTop: "2px solid var(--ink)", paddingTop: 36, display: "flex", alignItems: "baseline", gap: 32 }}>
          <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 120, letterSpacing: -4, color: "var(--coral)", lineHeight: 1 }}>
            {str(f.figure)}
          </div>
          <p style={{ fontSize: 28, lineHeight: 1.4, color: "#4A4538", margin: 0, maxWidth: 420 }}>{str(f.figureLabel)}</p>
        </div>
      </div>
    </Stage>
  ),
};
