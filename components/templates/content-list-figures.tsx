import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { uid } from "@/lib/model/deck";
import type { SlideElement } from "@/lib/model/deck";
import { Stage, Kicker, AccentTitle, Rule, Stat, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// A vertical ledger: a hard rule over each row, a figure in a fixed column that
// forms a real alignment axis, then a heading and a description.
export const contentListFigures: TemplateDef = {
  id: "content-list-figures",
  name: "Content · figures list",
  description: "A vertical list of figure + heading + description rows for framed points.",
  tags: ["list", "points", "figures", "breakdown", "content"],
  background: "cream",
  fields: [
    // The kicker was missing, which broke the deck's kicker → title → body
    // rhythm every time this slide appeared.
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 90, hint: "Wrap accent in [[…]]" },
    {
      key: "items",
      type: "list",
      label: "Rows",
      itemLabel: "Row",
      maxItems: 4,
      itemFields: [
        { key: "figure", type: "text", label: "Figure", maxLength: 8, placeholder: "60%" },
        { key: "head", type: "text", label: "Heading", maxLength: 40 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 120 },
      ],
    },
    { key: "takeaway", type: "textarea", label: "Takeaway", maxLength: 120, hint: "Wrap accent in [[…]]" },
  ],
  defaults: () => ({
    kicker: "WHY THIS MATTERS",
    title: "The old way of working is [[broken]].",
    items: [
      { figure: "60%", head: "Time lost to coordination", desc: "Status meetings, updates, and chasing — not the work itself." },
      { figure: "1 in 4", head: "Decisions get lost", desc: "Context lives in someone's head or a buried thread." },
      { figure: "3×", head: "Duplicated effort", desc: "The same work redone because no one could find the first version." },
    ],
    takeaway: "AI can't fix a process that was [[never designed]].",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const items = rows(f.items);
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 60px", display: "flex", flexDirection: "column" }}
      >
        {str(f.kicker) && <Kicker style={{ marginBottom: 20 }}>{str(f.kicker)}</Kicker>}
        <AccentTitle text={str(f.title)} size={TYPE.h3} style={{ color: t.title }} />
        <div style={{ display: "flex", flexDirection: "column", marginTop: "var(--s5)", flex: 1, minHeight: 0 }}>
          {items.map((row, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingBottom: 8,
              }}
            >
              <Rule tone={t} weight="1" color={t.ruleStrong} style={{ marginBottom: 24 }} />
              <div style={{ display: "flex", alignItems: "baseline", gap: 40 }}>
                <Stat value={str(row.figure)} size={TYPE.statSm - 14} color={t.accent} style={{ minWidth: 220 }} />
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div
                    style={{
                      fontFamily: "var(--font-title)",
                      fontWeight: 600,
                      fontSize: TYPE.h5 - 2,
                      letterSpacing: titleTracking(TYPE.h5),
                      color: t.title,
                    }}
                  >
                    {row.head}
                  </div>
                  <p style={{ fontSize: TYPE.body, lineHeight: 1.45, color: t.body, margin: 0, maxWidth: 900 }}>
                    {row.desc}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {str(f.takeaway) && (
          <p
            style={{
              fontSize: TYPE.h5,
              lineHeight: 1.4,
              margin: "18px 0 0",
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
    const items = rows(f.items);
    const n = Math.max(items.length, 1);
    // Rows are laid out from the same band the flow layout uses and share the
    // band evenly, so detaching does not shift them the way a fixed 160px step
    // did once a description wrapped to two lines.
    const bandTop = 300;
    const bandH = 600;
    const step = bandH / n;
    const els: SlideElement[] = [
      { id: uid("el"), type: "text", x: 130, y: 90, w: 1200, h: 34, rotation: 0, fieldKey: "kicker",
        style: { fontFamily: "var(--font-mono)", fontSize: TYPE.kicker, letterSpacing: 5, fontWeight: 500, textTransform: "uppercase", color: t.accent }, content: str(f.kicker) },
      { id: uid("el"), type: "text", x: 130, y: 150, w: 1500, h: 120, rotation: 0, fieldKey: "title",
        style: { fontFamily: "var(--font-title)", fontSize: TYPE.h3, fontWeight: 600, letterSpacing: titleTracking(TYPE.h3), lineHeight: 1.08, color: t.title }, content: str(f.title) },
    ];
    items.forEach((it, i) => {
      const y = bandTop + i * step;
      els.push(
        { id: uid("el"), type: "shape", x: 130, y, w: 1660, h: 2, rotation: 0, style: { background: t.ruleStrong } },
        { id: uid("el"), type: "text", x: 130, y: y + 30, w: 220, h: 76, rotation: 0,
          style: { fontFamily: "var(--font-title)", fontSize: TYPE.statSm - 14, fontWeight: 600, letterSpacing: titleTracking(TYPE.statSm - 14), lineHeight: 1, color: t.accent }, content: str(it.figure) },
        { id: uid("el"), type: "text", x: 390, y: y + 30, w: 1400, h: 46, rotation: 0,
          style: { fontFamily: "var(--font-title)", fontSize: TYPE.h5 - 2, fontWeight: 600, letterSpacing: titleTracking(TYPE.h5), color: t.title }, content: str(it.head) },
        { id: uid("el"), type: "text", x: 390, y: y + 86, w: 1400, h: 44, rotation: 0,
          style: { fontFamily: "var(--font-body)", fontSize: TYPE.body, lineHeight: 1.45, color: t.body }, content: str(it.desc) }
      );
    });
    if (str(f.takeaway)) {
      els.push({ id: uid("el"), type: "text", x: 130, y: 940, w: 1600, h: 60, rotation: 0, fieldKey: "takeaway",
        style: { fontFamily: "var(--font-title)", fontSize: TYPE.h5, fontWeight: 500, lineHeight: 1.4, color: t.title }, content: str(f.takeaway) });
    }
    return els;
  },
};
