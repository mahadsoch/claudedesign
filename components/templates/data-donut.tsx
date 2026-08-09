import type { TemplateDef } from "./types";
import { str, rows, numOf } from "./types";
import { Stage, SectionHead, Ring, Stat, parseAccents, tone, TYPE } from "./_shared/primitives";

// Up to three progress rings. Use when the number *is* a proportion — a share,
// a completion, a hit rate — and a bar would understate it.
//
// The track is a bordered div (a native PowerPoint ellipse); only the arc is
// SVG, because that geometry is genuinely curved. The centred label is HTML on
// top, never text inside the SVG — webfonts do not load in a rasterised SVG.
export const dataDonut: TemplateDef = {
  id: "data-donut",
  name: "Data · progress rings",
  description: "Two or three proportions as progress rings — shares, completion, or hit rates.",
  tags: ["chart", "data", "donut", "ring", "percent", "share", "proportion", "gauge", "metrics"],
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    {
      key: "rings",
      type: "list",
      label: "Rings",
      itemLabel: "Ring",
      maxItems: 3,
      itemFields: [
        { key: "value", type: "text", label: "Value", maxLength: 6, placeholder: "62", hint: "A percentage — drives the arc" },
        { key: "unit", type: "text", label: "Unit", maxLength: 3, placeholder: "%" },
        { key: "label", type: "text", label: "Label", maxLength: 34 },
        { key: "note", type: "text", label: "Note", maxLength: 60 },
      ],
    },
    { key: "takeaway", type: "textarea", label: "Takeaway", maxLength: 120, hint: "Wrap accent in [[…]]" },
  ],
  defaults: () => ({
    kicker: "AFTER THE PILOT",
    title: "What actually moved",
    rings: [
      { value: "62", unit: "%", label: "Less manual handling", note: "Measured over 8 weeks in parallel." },
      { value: "94", unit: "%", label: "Straight-through rate", note: "Up from 71% before the rebuild." },
      { value: "30", unit: "%", label: "Faster cycle time", note: "Median invoice, submission to approval." },
    ],
    takeaway: "The gains come from the failure paths, not the [[happy path]].",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const rings = rows(f.rings);
    const n = Math.max(rings.length, 1);
    const size = n === 1 ? 400 : n === 2 ? 340 : 300;
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 70px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />

        <div
          style={{
            marginTop: "var(--s6)",
            flex: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${n}, 1fr)`,
            gap: "var(--s7)",
            alignItems: "center",
            justifyItems: "center",
            minHeight: 0,
          }}
        >
          {rings.map((r, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "var(--s3)" }}>
              <Ring
                pct={numOf(str(r.value)) / 100}
                tone={t}
                size={size}
                thickness={Math.round(size * 0.09)}
                // Only the first ring carries the accent; the others recede to
                // the muted tone so the row has a focal point rather than three
                // equal shouts. The centred figure stays at full contrast
                // because it still has to be read.
                color={i === 0 ? t.accent : t.muted}
              >
                <Stat
                  value={str(r.value)}
                  unit={str(r.unit)}
                  size={Math.round(size * 0.26)}
                  color={i === 0 ? t.accent : t.title}
                />
              </Ring>
              <div
                style={{
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: TYPE.h6 - 2,
                  color: t.title,
                  textAlign: "center",
                  marginTop: 8,
                }}
              >
                {r.label}
              </div>
              <p
                style={{
                  fontSize: TYPE.bodySm,
                  lineHeight: 1.45,
                  color: t.body,
                  margin: 0,
                  textAlign: "center",
                  maxWidth: 360,
                }}
              >
                {r.note}
              </p>
            </div>
          ))}
        </div>

        {str(f.takeaway) && (
          <p
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 500,
              fontSize: TYPE.h5 - 2,
              lineHeight: 1.4,
              margin: "var(--s5) 0 0",
              color: t.title,
            }}
          >
            {parseAccents(str(f.takeaway))}
          </p>
        )}
      </Stage>
    );
  },
};
