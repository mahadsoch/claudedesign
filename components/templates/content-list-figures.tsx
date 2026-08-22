import type { TemplateDef } from "./types";
import { str, rows } from "./types";
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
};
