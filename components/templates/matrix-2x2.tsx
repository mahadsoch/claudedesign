import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Logo } from "./_shared/primitives";

type Highlight = "none" | "target" | "here";

function cardStyle(h: Highlight): React.CSSProperties {
  if (h === "target")
    return { border: "2.5px solid var(--coral)", background: "var(--coral)", color: "var(--cream)" };
  if (h === "here")
    return { border: "2px solid var(--ink)", background: "var(--ink)", color: "var(--cream)" };
  return { border: "1.5px solid var(--card-border)", background: "var(--card-fill)", color: "var(--ink)" };
}
function tagColor(h: Highlight): string {
  if (h === "target") return "var(--cream)";
  if (h === "here") return "var(--coral)";
  return "var(--warm-gray)";
}
function descColor(h: Highlight): string {
  return h === "none" ? "var(--body-light)" : h === "here" ? "var(--body-dark-3)" : "var(--cream)";
}

export const matrix2x2: TemplateDef = {
  id: "matrix-2x2",
  name: "2×2 matrix",
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 44 },
    { key: "title", type: "textarea", label: "Title", maxLength: 44 },
    { key: "yAxis", type: "text", label: "Y-axis label", maxLength: 20, placeholder: "AI MATURITY" },
    { key: "xAxis", type: "text", label: "X-axis label", maxLength: 24, placeholder: "WORK CONTEXT" },
    {
      key: "quadrants",
      type: "list",
      label: "Quadrants (4: TL, TR, BL, BR)",
      itemLabel: "Quadrant",
      maxItems: 4,
      itemFields: [
        { key: "tag", type: "text", label: "Tag", maxLength: 26, placeholder: "QUADRANT · I" },
        { key: "title", type: "text", label: "Title", maxLength: 30 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 110 },
        { key: "impact", type: "text", label: "Impact line", maxLength: 60 },
        { key: "highlight", type: "text", label: "Highlight: none / target / here", maxLength: 8 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "A MAP TO PLACE YOURSELF ON",
    title: "The AI transformation matrix.",
    yAxis: "AI MATURITY",
    xAxis: "WORK CONTEXT",
    quadrants: [
      { tag: "QUADRANT · II", title: "Siloed automation", desc: "Automation lives inside isolated apps, never across the org.", impact: "Impact · efficiency gained, silos persist.", highlight: "none" },
      { tag: "QUADRANT · I · ★ TARGET", title: "Ambient AI", desc: "AI deeply integrated into a unified workspace, proactively managing work.", impact: "Impact · exponential productivity.", highlight: "target" },
      { tag: "QUADRANT · III · YOU ARE HERE", title: "Disconnected, manual work", desc: "Work sprawls across disconnected apps. One-off AI experiments.", impact: "Impact · lost context, duplicated effort.", highlight: "here" },
      { tag: "QUADRANT · IV", title: "Unified, manual work", desc: "Centralized in one workspace, but tasks are still performed by hand.", impact: "Impact · visibility up, productivity flat.", highlight: "none" },
    ],
  }),
  render: (f) => {
    const quads = rows(f.quadrants).slice(0, 4);
    return (
      <Stage background="cream" style={{ padding: "80px 120px 60px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Kicker>{str(f.kicker)}</Kicker>
            <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 60, letterSpacing: -2, lineHeight: 1.08, margin: "24px 0 0" }}>{str(f.title)}</h2>
          </div>
          <Logo height={36} />
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 40, flex: 1, minHeight: 0 }}>
          {/* Y axis rail */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 60 }}>
            <div style={{ fontSize: 32, lineHeight: 1, color: "var(--coral)" }}>↑</div>
            <div style={{ width: 2.5, flex: 1, background: "var(--ink)" }} />
            <div style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", fontFamily: "var(--font-mono)", fontSize: 22, letterSpacing: 3, color: "var(--ink)", fontWeight: 700, padding: "6px 0" }}>
              {str(f.yAxis)}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 20, minHeight: 0 }}>
              {quads.map((q, i) => {
                const h = (["none", "target", "here"].includes(String(q.highlight)) ? q.highlight : "none") as Highlight;
                return (
                  <div key={i} style={{ borderRadius: 20, padding: "28px 34px", display: "flex", flexDirection: "column", gap: 12, ...cardStyle(h) }}>
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, letterSpacing: 2, fontWeight: 700, color: tagColor(h) }}>{q.tag}</div>
                    <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 32, letterSpacing: -0.5 }}>{q.title}</div>
                    <p style={{ fontSize: 23, lineHeight: 1.4, color: descColor(h), margin: 0 }}>{q.desc}</p>
                    <p style={{ fontSize: 23, lineHeight: 1.4, margin: "auto 0 0", fontWeight: 600 }}>{q.impact}</p>
                  </div>
                );
              })}
            </div>
            {/* X axis rail */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, letterSpacing: 3, color: "var(--ink)", fontWeight: 700 }}>{str(f.xAxis)}</div>
              <div style={{ height: 2.5, flex: 1, background: "var(--ink)" }} />
              <div style={{ fontSize: 32, lineHeight: 1, color: "var(--coral)" }}>→</div>
            </div>
          </div>
        </div>
      </Stage>
    );
  },
};
