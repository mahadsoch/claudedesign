import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { uid } from "@/lib/model/deck";
import { Stage, Kicker, parseAccents } from "./_shared/primitives";
import type { SlideElement } from "@/lib/model/deck";

export const bigStats: TemplateDef = {
  id: "big-stats",
  name: "Big stats",
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
  render: (f) => {
    const stats = rows(f.stats);
    return (
      <Stage background="dark" style={{ padding: "100px 120px 70px", display: "flex", flexDirection: "column" }}>
        <Kicker>{str(f.kicker)}</Kicker>
        <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 72, letterSpacing: -2, lineHeight: 1.08, margin: "28px 0 0" }}>
          {parseAccents(str(f.title))}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${Math.max(stats.length, 1)}, 1fr)`,
            gap: 80,
            marginTop: 70,
            flex: 1,
            alignItems: "start",
          }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{ borderTop: "2px solid var(--border-dark)", paddingTop: 44, display: "flex", flexDirection: "column", gap: 20 }}>
              <div
                style={{
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: 190,
                  lineHeight: 0.95,
                  letterSpacing: -6,
                  color: i === 0 ? "var(--coral)" : "var(--cream)",
                }}
              >
                <span>{s.value}</span>
                <span style={{ fontSize: 100, letterSpacing: -2 }}>{s.unit}</span>
              </div>
              <p style={{ fontSize: 30, lineHeight: 1.4, margin: 0, color: "var(--body-dark-2)" }}>{s.label}</p>
              {s.source && (
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 3, color: "var(--warm-gray)" }}>{s.source}</div>
              )}
            </div>
          ))}
        </div>
        {str(f.takeaway) && (
          <p style={{ fontSize: 36, lineHeight: 1.4, margin: 0, fontFamily: "var(--font-title)", fontWeight: 500 }}>
            {parseAccents(str(f.takeaway))}
          </p>
        )}
      </Stage>
    );
  },
  expand: (f) => {
    const stats = rows(f.stats);
    const els: SlideElement[] = [
      { id: uid("el"), type: "text", x: 120, y: 100, w: 1000, h: 32, rotation: 0, fieldKey: "kicker",
        style: { fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 5, fontWeight: 500, textTransform: "uppercase", color: "var(--coral)" }, content: str(f.kicker) },
      { id: uid("el"), type: "text", x: 120, y: 150, w: 1400, h: 90, rotation: 0, fieldKey: "title",
        style: { fontFamily: "var(--font-title)", fontSize: 72, fontWeight: 600, letterSpacing: -2, lineHeight: 1.08, color: "var(--cream)" }, content: str(f.title) },
    ];
    const colW = Math.floor((1680 - 80 * (stats.length - 1)) / Math.max(stats.length, 1));
    stats.forEach((s, i) => {
      const x = 120 + i * (colW + 80);
      els.push(
        { id: uid("el"), type: "shape", x, y: 300, w: colW, h: 2, rotation: 0, style: { background: "var(--border-dark)" } },
        { id: uid("el"), type: "text", x, y: 330, w: colW, h: 200, rotation: 0,
          style: { fontFamily: "var(--font-title)", fontSize: 190, fontWeight: 600, letterSpacing: -6, lineHeight: 0.95, color: i === 0 ? "var(--coral)" : "var(--cream)" }, content: `${s.value ?? ""}${s.unit ?? ""}` },
        { id: uid("el"), type: "text", x, y: 560, w: colW, h: 50, rotation: 0,
          style: { fontFamily: "var(--font-body)", fontSize: 30, lineHeight: 1.4, color: "var(--body-dark-2)" }, content: s.label ?? "" },
        { id: uid("el"), type: "text", x, y: 620, w: colW, h: 34, rotation: 0,
          style: { fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 3, color: "var(--warm-gray)" }, content: s.source ?? "" }
      );
    });
    if (str(f.takeaway)) {
      els.push({ id: uid("el"), type: "text", x: 120, y: 940, w: 1600, h: 60, rotation: 0, fieldKey: "takeaway",
        style: { fontFamily: "var(--font-title)", fontSize: 36, fontWeight: 500, lineHeight: 1.4, color: "var(--cream)" }, content: str(f.takeaway) });
    }
    return els;
  },
};
