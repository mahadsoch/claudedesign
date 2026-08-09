import type { CSSProperties } from "react";
import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Logo, Arrow, tone, TYPE, titleTracking, type Tone } from "./_shared/primitives";

type Highlight = "none" | "target" | "here";

function cardStyle(h: Highlight, t: Tone): CSSProperties {
  if (h === "target")
    return { border: `var(--rule-2) solid ${t.accent}`, background: t.accent, color: t.onAccent };
  if (h === "here")
    return {
      border: `var(--rule-1) solid ${t.ruleStrong}`,
      background: t.bg === "cream" ? "var(--ink)" : "var(--cream)",
      color: t.bg === "cream" ? "var(--cream)" : "var(--ink)",
    };
  return {
    border: t.panelBorder === "none" ? "none" : `var(--rule-hair) solid ${t.panelBorder}`,
    background: t.panel,
    color: t.title,
  };
}
function tagColor(h: Highlight, t: Tone): string {
  if (h === "target") return t.onAccent;
  if (h === "here") return t.accent;
  return t.muted;
}

export const matrix2x2: TemplateDef = {
  id: "matrix-2x2",
  name: "2×2 matrix",
  description: "A labelled 2×2 matrix with X/Y axes to position options or frame a strategy.",
  tags: ["matrix", "framework", "2x2", "positioning", "strategy"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 44 },
    { key: "title", type: "textarea", label: "Title", maxLength: 44 },
    { key: "yAxis", type: "text", label: "Y-axis label", maxLength: 20, placeholder: "AI MATURITY" },
    { key: "xAxis", type: "text", label: "X-axis label", maxLength: 24, placeholder: "WORK CONTEXT" },
    {
      key: "quadrants",
      type: "list",
      label: "Quadrants (in reading order: TL, TR, BL, BR)",
      itemLabel: "Quadrant",
      maxItems: 4,
      itemFields: [
        { key: "tag", type: "text", label: "Tag", maxLength: 26, placeholder: "QUADRANT · I" },
        { key: "title", type: "text", label: "Title", maxLength: 30 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 110 },
        { key: "impact", type: "text", label: "Impact line", maxLength: 60 },
        // Was a free-text field with the valid values written into its label,
        // so a typo silently fell back to "none".
        {
          key: "highlight",
          type: "select",
          label: "Emphasis",
          options: [
            { value: "none", label: "None" },
            { value: "target", label: "Target (accent fill)" },
            { value: "here", label: "You are here (inverted)" },
          ],
        },
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
      { tag: "QUADRANT · I · TARGET", title: "Ambient AI", desc: "AI deeply integrated into a unified workspace, proactively managing work.", impact: "Impact · exponential productivity.", highlight: "target" },
      { tag: "QUADRANT · III · YOU ARE HERE", title: "Disconnected, manual work", desc: "Work sprawls across disconnected apps. One-off AI experiments.", impact: "Impact · lost context, duplicated effort.", highlight: "here" },
      { tag: "QUADRANT · IV", title: "Unified, manual work", desc: "Centralized in one workspace, but tasks are still performed by hand.", impact: "Impact · visibility up, productivity flat.", highlight: "none" },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const quads = rows(f.quadrants).slice(0, 4);
    const axisLabel: CSSProperties = {
      fontFamily: "var(--font-mono)",
      fontSize: TYPE.bodySm,
      letterSpacing: 3,
      color: t.title,
      fontWeight: 700,
    };
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "80px var(--pad-x) 60px", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Kicker>{str(f.kicker)}</Kicker>
            <h2
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: TYPE.h3,
                letterSpacing: titleTracking(TYPE.h3),
                lineHeight: 1.08,
                margin: "24px 0 0",
                color: t.title,
              }}
            >
              {str(f.title)}
            </h2>
          </div>
          <Logo height={36} />
        </div>
        <div style={{ display: "flex", gap: 28, marginTop: 40, flex: 1, minHeight: 0 }}>
          {/* Y axis rail. The arrowheads are SVG, not ↑/→ glyphs: those fall
              outside the three brand families and are coerced to Open Sans on
              export, where they may not exist at all. */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, width: 60 }}>
            <Arrow dir="up" size={26} color={t.accent} />
            <div style={{ width: "var(--rule-2)", flex: 1, background: t.ruleStrong }} />
            <div
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                padding: "6px 0",
                ...axisLabel,
              }}
            >
              {str(f.yAxis)}
            </div>
          </div>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
            <div
              style={{
                flex: 1,
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gridTemplateRows: "1fr 1fr",
                gap: 20,
                minHeight: 0,
              }}
            >
              {quads.map((q, i) => {
                const h = (["none", "target", "here"].includes(String(q.highlight))
                  ? q.highlight
                  : "none") as Highlight;
                const skin = cardStyle(h, t);
                return (
                  <div
                    key={i}
                    style={{
                      borderRadius: "var(--r-panel)",
                      padding: "28px 34px",
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      boxSizing: "border-box",
                      minHeight: 0,
                      ...skin,
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: TYPE.bodySm,
                        letterSpacing: 2,
                        fontWeight: 700,
                        color: tagColor(h, t),
                      }}
                    >
                      {q.tag}
                    </div>
                    <div
                      style={{
                        fontFamily: "var(--font-title)",
                        fontWeight: 600,
                        fontSize: TYPE.h5 - 4,
                        letterSpacing: titleTracking(TYPE.h5),
                      }}
                    >
                      {q.title}
                    </div>
                    {/* Description and impact share a size so only two type
                        sizes compete inside the card (DESIGN.md). */}
                    <p style={{ fontSize: TYPE.bodySm + 1, lineHeight: 1.4, margin: 0, opacity: 0.86 }}>
                      {q.desc}
                    </p>
                    <p style={{ fontSize: TYPE.bodySm + 1, lineHeight: 1.4, margin: "auto 0 0", fontWeight: 600 }}>
                      {q.impact}
                    </p>
                  </div>
                );
              })}
            </div>
            {/* X axis rail */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 20 }}>
              <div style={axisLabel}>{str(f.xAxis)}</div>
              <div style={{ height: "var(--rule-2)", flex: 1, background: t.ruleStrong }} />
              <Arrow dir="right" size={26} color={t.accent} />
            </div>
          </div>
        </div>
      </Stage>
    );
  },
};
