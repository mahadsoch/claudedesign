import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Kicker } from "./_shared/primitives";

// "The Context" slide: a situation narrative on the left, a coral-wash stat
// rail on the right stacking a few by-the-numbers figures.
export const contextStatRail: TemplateDef = {
  id: "context-stat-rail",
  name: "Context + stat rail",
  description: "Frame the situation with a short narrative beside a rail of 2–3 supporting figures.",
  tags: ["context", "situation", "background", "stats", "numbers", "today"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "01 · THE CONTEXT" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "situationLabel", type: "text", label: "Situation label", maxLength: 30 },
    { key: "body1", type: "textarea", label: "Paragraph 1", maxLength: 200, hint: "Wrap accent in [[…]]" },
    { key: "body2", type: "textarea", label: "Paragraph 2", maxLength: 200 },
    { key: "body3", type: "textarea", label: "Paragraph 3", maxLength: 200 },
    { key: "statsLabel", type: "text", label: "Stats label", maxLength: 30 },
    {
      key: "stats",
      type: "list",
      label: "Figures",
      itemLabel: "Figure",
      maxItems: 3,
      itemFields: [
        { key: "value", type: "text", label: "Value", maxLength: 12, placeholder: "15" },
        { key: "label", type: "text", label: "Label", maxLength: 70 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "01 · THE CONTEXT",
    title: "Where Leadtech is today",
    situationLabel: "THE SITUATION",
    body1: "Leadtech already runs a working invoice approval automation, built on n8n and the Claude API. [[It works.]]",
    body2: "It was assembled reactively, as a proof of concept, and has not yet been hardened into something the team can rely on.",
    body3: "Phase 1 is the pilot. It proves production-grade automation can ship on your stack.",
    statsLabel: "BY THE NUMBERS",
    stats: [
      { value: "1", label: "live proof of concept in production today" },
      { value: "15", label: "workflows mapped across the next three quarters" },
      { value: "3 Qtrs", label: "before the roadmap extends across the company" },
    ],
  }),
  render: (f) => {
    const stats = rows(f.stats);
    const bodies = [str(f.body1), str(f.body2), str(f.body3)].filter(Boolean);
    return (
      <Stage background="cream" style={{ padding: "90px 130px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        <div style={{ marginTop: 56, flex: 1, display: "flex", gap: 90, minHeight: 0 }}>
          <div style={{ flex: 1.1, minWidth: 0 }}>
            {str(f.situationLabel) && (
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, letterSpacing: 3, fontWeight: 600, textTransform: "uppercase", color: "var(--ink)", paddingBottom: 24, borderLeft: "2px solid var(--coral)", paddingLeft: 22 }}>
                {str(f.situationLabel)}
              </div>
            )}
            <div style={{ display: "flex", flexDirection: "column", gap: 26, paddingLeft: 24 }}>
              {bodies.map((b, i) => (
                <p key={i} style={{ fontSize: 28, lineHeight: 1.5, margin: 0, color: i === 0 ? "var(--ink)" : "var(--body-light)" }}>
                  {b.split(/(\[\[.+?\]\])/).map((seg, j) =>
                    seg.startsWith("[[") ? (
                      <b key={j} style={{ color: "var(--coral)" }}>{seg.slice(2, -2)}</b>
                    ) : (
                      seg
                    )
                  )}
                </p>
              ))}
            </div>
          </div>

          <div style={{ flex: "0 0 560px", background: "var(--coral-wash)", borderRadius: 24, padding: "48px 52px", display: "flex", flexDirection: "column" }}>
            <Kicker>{str(f.statsLabel)}</Kicker>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column" }}>
              {stats.map((s, i) => (
                <div key={i} style={{ padding: "26px 0", borderTop: i === 0 ? "none" : "1px solid rgba(20,20,20,0.12)" }}>
                  <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 66, letterSpacing: -2, color: "var(--coral)", lineHeight: 1 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 24, color: "var(--body-light)", marginTop: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Stage>
    );
  },
};
