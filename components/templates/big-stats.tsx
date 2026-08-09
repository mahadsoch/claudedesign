import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { uid } from "@/lib/model/deck";
import { Stage, Kicker, Rule, Stat, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";
import type { SlideElement } from "@/lib/model/deck";

export const bigStats: TemplateDef = {
  id: "big-stats",
  name: "Big stats",
  description: "Up to three giant metrics that carry the slide, with a takeaway line.",
  tags: ["stats", "metrics", "numbers", "data", "impact"],
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 70, hint: "Wrap accent in [[…]]" },
    {
      key: "stats",
      type: "list",
      label: "Stats",
      itemLabel: "Stat",
      maxItems: 3,
      itemFields: [
        { key: "value", type: "text", label: "Value", maxLength: 6, placeholder: "12" },
        { key: "unit", type: "text", label: "Unit", maxLength: 4, placeholder: "%" },
        { key: "label", type: "textarea", label: "Label", maxLength: 60 },
        { key: "source", type: "text", label: "Source", maxLength: 30, placeholder: "SOURCE · GALLUP" },
      ],
    },
    { key: "takeaway", type: "textarea", label: "Takeaway", maxLength: 120, hint: "Wrap accent in [[…]]" },
  ],
  defaults: () => ({
    kicker: "THE STATE OF AI AT WORK",
    title: "Companies are struggling.",
    stats: [
      { value: "12", unit: "%", label: "of employees use AI daily.", source: "SOURCE · GALLUP" },
      { value: "5", unit: "%", label: "of AI pilots succeed.", source: "SOURCE · MIT" },
    ],
    takeaway: "The gap is not the tools. The gap is [[how they are deployed.]]",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const stats = rows(f.stats);
    const n = Math.max(stats.length, 1);
    // A single stat gets the full stage rather than one 1680px-wide column, and
    // is set larger because it is carrying the slide alone.
    const solo = n === 1;
    const figure = solo ? TYPE.stat + 60 : n === 2 ? TYPE.stat : TYPE.stat - 40;
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "100px var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <Kicker>{str(f.kicker)}</Kicker>
        <h2
          style={{
            fontFamily: "var(--font-title)",
            fontWeight: 600,
            fontSize: TYPE.h2,
            letterSpacing: titleTracking(TYPE.h2),
            lineHeight: 1.08,
            margin: "28px 0 0",
            color: t.title,
          }}
        >
          {parseAccents(str(f.title))}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: solo ? "minmax(0, 1100px)" : `repeat(${n}, 1fr)`,
            gap: 80,
            marginTop: 70,
            flex: 1,
            alignItems: "start",
          }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <Rule tone={t} weight="1" color={t.rule} style={{ marginBottom: 44 }} />
              <Stat
                value={str(s.value)}
                unit={str(s.unit)}
                size={figure}
                // The first figure carries the accent; the rest stay neutral, so
                // the row has a focal point instead of three equal shouts.
                color={i === 0 ? t.accent : t.title}
              />
              <p style={{ fontSize: TYPE.h6, lineHeight: 1.4, margin: 0, color: t.bodyStrong }}>{s.label}</p>
              {s.source && (
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: TYPE.kicker,
                    letterSpacing: 3,
                    color: t.muted,
                  }}
                >
                  {s.source}
                </div>
              )}
            </div>
          ))}
        </div>
        {str(f.takeaway) && (
          <p
            style={{
              fontSize: TYPE.h5,
              lineHeight: 1.4,
              margin: "var(--s6) 0 0",
              fontFamily: "var(--font-title)",
              fontWeight: 500,
              color: t.title,
            }}
          >
            {parseAccents(str(f.takeaway))}
          </p>
        )}
      </Stage>
    );
  },
  expand: (f, ctx) => {
    const t = tone(ctx.background);
    const stats = rows(f.stats);
    const n = Math.max(stats.length, 1);
    const figure = n === 1 ? TYPE.stat + 60 : n === 2 ? TYPE.stat : TYPE.stat - 40;
    const els: SlideElement[] = [
      { id: uid("el"), type: "text", x: 130, y: 100, w: 1000, h: 32, rotation: 0, fieldKey: "kicker",
        style: { fontFamily: "var(--font-mono)", fontSize: TYPE.kicker, letterSpacing: 5, fontWeight: 500, textTransform: "uppercase", color: t.accent }, content: str(f.kicker) },
      { id: uid("el"), type: "text", x: 130, y: 160, w: 1400, h: 90, rotation: 0, fieldKey: "title",
        style: { fontFamily: "var(--font-title)", fontSize: TYPE.h2, fontWeight: 600, letterSpacing: titleTracking(TYPE.h2), lineHeight: 1.08, color: t.title }, content: str(f.title) },
    ];
    const colW = Math.floor((1660 - 80 * (n - 1)) / n);
    stats.forEach((s, i) => {
      const x = 130 + i * (colW + 80);
      els.push(
        { id: uid("el"), type: "shape", x, y: 320, w: colW, h: 2, rotation: 0, style: { background: t.rule } },
        // Value and unit stay separate elements so the export keeps the size
        // split DESIGN.md calls for (the unit at about half the figure).
        { id: uid("el"), type: "text", x, y: 364, w: colW, h: 210, rotation: 0,
          style: { fontFamily: "var(--font-title)", fontSize: figure, fontWeight: 600, letterSpacing: titleTracking(figure), lineHeight: 0.95, color: i === 0 ? t.accent : t.title }, content: str(s.value) },
        { id: uid("el"), type: "text", x: x + Math.round(colW * 0.52), y: 372, w: 160, h: 120, rotation: 0,
          style: { fontFamily: "var(--font-title)", fontSize: Math.round(figure * 0.52), fontWeight: 600, letterSpacing: titleTracking(figure * 0.52), lineHeight: 0.95, color: i === 0 ? t.accent : t.title }, content: str(s.unit) },
        { id: uid("el"), type: "text", x, y: 596, w: colW, h: 50, rotation: 0,
          style: { fontFamily: "var(--font-body)", fontSize: TYPE.h6, lineHeight: 1.4, color: t.bodyStrong }, content: str(s.label) },
        { id: uid("el"), type: "text", x, y: 660, w: colW, h: 34, rotation: 0,
          style: { fontFamily: "var(--font-mono)", fontSize: TYPE.kicker, letterSpacing: 3, color: t.muted }, content: str(s.source) }
      );
    });
    if (str(f.takeaway)) {
      els.push({ id: uid("el"), type: "text", x: 130, y: 930, w: 1600, h: 60, rotation: 0, fieldKey: "takeaway",
        style: { fontFamily: "var(--font-title)", fontSize: TYPE.h5, fontWeight: 500, lineHeight: 1.4, color: t.title }, content: str(f.takeaway) });
    }
    return els;
  },
};
