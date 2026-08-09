import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Kicker, Panel, Rule, Stat, parseAccents, tone, TYPE } from "./_shared/primitives";

// "The Context" slide: a situation narrative on the left against a full-height
// accent rail, a stat panel on the right.
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
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const stats = rows(f.stats);
    const bodies = [str(f.body1), str(f.body2), str(f.body3)].filter(Boolean);
    return (
      <Stage background={ctx.background} style={{ display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />
        <div style={{ marginTop: "var(--s6)", flex: 1, display: "flex", gap: 90, minHeight: 0 }}>
          {/* The rail runs the full height of the narrative, not just the label
              — as a stub it read as a stray mark rather than as structure. */}
          <div style={{ flex: 1.1, minWidth: 0, display: "flex", gap: 24 }}>
            <Rule tone={t} weight="1" color={t.accent} vertical />
            <div style={{ display: "flex", flexDirection: "column", gap: 26, minWidth: 0 }}>
              {str(f.situationLabel) && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: TYPE.bodySm,
                    letterSpacing: 3,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: t.title,
                  }}
                >
                  {str(f.situationLabel)}
                </div>
              )}
              {bodies.map((b, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: TYPE.h6 - 2,
                    lineHeight: 1.5,
                    margin: 0,
                    // Emphasis decays down the column: the first paragraph is
                    // the claim, the rest are support.
                    color: i === 0 ? t.bodyStrong : t.body,
                  }}
                >
                  {parseAccents(b)}
                </p>
              ))}
            </div>
          </div>

          <Panel tone={t} style={{ flex: "0 0 560px", padding: "48px 52px" }}>
            <Kicker>{str(f.statsLabel)}</Kicker>
            <div style={{ marginTop: 20, display: "flex", flexDirection: "column", flex: 1 }}>
              {stats.map((s, i) => (
                <div key={i} style={{ padding: "26px 0", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  {i > 0 && <Rule tone={t} style={{ marginTop: -26, marginBottom: 26 }} />}
                  <Stat value={str(s.value)} size={TYPE.statSm - 10} color={t.accent} />
                  <div style={{ fontSize: TYPE.bodySm + 2, color: t.body, marginTop: 10 }}>{s.label}</div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      </Stage>
    );
  },
};
