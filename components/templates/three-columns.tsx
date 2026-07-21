import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, IconChip } from "./_shared/primitives";

// Three parallel points separated by rules, each with an icon chip, a bold
// heading and a paragraph. The "problem" slide from the proposal decks.
export const threeColumns: TemplateDef = {
  id: "three-columns",
  name: "Three columns",
  description: "Three parallel points side by side, each with an icon, heading and short paragraph.",
  tags: ["columns", "problem", "three", "points", "reasons", "pillars"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "02 · THE PROBLEM" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    {
      key: "columns",
      type: "list",
      label: "Columns",
      itemLabel: "Column",
      maxItems: 3,
      itemFields: [
        { key: "icon", type: "image", label: "Icon" },
        { key: "head", type: "text", label: "Heading", maxLength: 40 },
        { key: "body", type: "textarea", label: "Body", maxLength: 200 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "02 · THE PROBLEM",
    title: "A working prototype is not yet a foundation",
    columns: [
      { icon: "", head: "Built reactively", body: "The current flow was assembled as a basic MVP. Edge cases and failure paths were not designed in." },
      { icon: "", head: "No engineering depth yet", body: "It was built solo, through trial and error. There is no specialist automation engineering behind it." },
      { icon: "", head: "Fragile under the roadmap", body: "Fifteen workflows are meant to sit on top of this. Today its failures are silent." },
    ],
  }),
  render: (f, ctx) => {
    const cols = rows(f.columns);
    return (
      <Stage background="cream" style={{ padding: "90px 130px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        <div style={{ marginTop: 64, flex: 1, display: "flex", minHeight: 0 }}>
          {cols.map((c, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: i === 0 ? "0 56px 0 0" : "0 56px",
                borderLeft: i === 0 ? "none" : "1px solid var(--card-border)",
                display: "flex",
                flexDirection: "column",
                gap: 26,
              }}
            >
              <IconChip src={ctx.resolveImage(str(c.icon))} />
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 34, letterSpacing: -0.5, lineHeight: 1.15 }}>
                {c.head}
              </div>
              <p style={{ fontSize: 26, lineHeight: 1.5, color: "var(--body-light)", margin: 0 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
