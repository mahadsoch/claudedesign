import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, AccentTitle, parseAccents } from "./_shared/primitives";

export const contentListFigures: TemplateDef = {
  id: "content-list-figures",
  name: "Content · figures list",
  background: "cream",
  fields: [
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
    title: "The old way of working is [[broken]].",
    items: [
      { figure: "60%", head: "Time lost to coordination", desc: "Status meetings, updates, and chasing — not the work itself." },
      { figure: "1 in 4", head: "Decisions get lost", desc: "Context lives in someone's head or a buried thread." },
      { figure: "3×", head: "Duplicated effort", desc: "The same work redone because no one could find the first version." },
    ],
    takeaway: "AI can't fix a process that was [[never designed]].",
  }),
  render: (f) => (
    <Stage background="cream" style={{ padding: "90px 120px 60px", display: "flex", flexDirection: "column" }}>
      <AccentTitle text={str(f.title)} size={64} />
      <div style={{ display: "flex", flexDirection: "column", marginTop: 48, flex: 1, minHeight: 0 }}>
        {rows(f.items).map((row, i) => (
          <div
            key={i}
            style={{
              borderTop: "2px solid var(--ink)",
              padding: "26px 0 20px",
              display: "flex",
              alignItems: "baseline",
              gap: 40,
            }}
          >
            <div
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: 62,
                letterSpacing: -2,
                color: "var(--coral)",
                minWidth: 220,
                lineHeight: 1,
              }}
            >
              {row.figure}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 34, letterSpacing: -0.5 }}>
                {row.head}
              </div>
              <p style={{ fontSize: 26, lineHeight: 1.45, color: "var(--body-light)", margin: 0, maxWidth: 900 }}>
                {row.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
      {str(f.takeaway) && (
        <p
          style={{
            fontSize: 36,
            lineHeight: 1.4,
            margin: "18px 0 0",
            fontFamily: "var(--font-title)",
            fontWeight: 500,
          }}
        >
          {parseAccents(str(f.takeaway))}
        </p>
      )}
    </Stage>
  ),
};
