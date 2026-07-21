import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Logo, parseAccents } from "./_shared/primitives";

export const twoColumnCompare: TemplateDef = {
  id: "two-column-compare",
  name: "Two-column compare",
  description: "Two options or states compared side by side with bullet points.",
  tags: ["compare", "versus", "before", "after", "options"],
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "takeaway", type: "textarea", label: "Takeaway", maxLength: 110, hint: "Wrap accent in [[…]]" },
    {
      key: "columns",
      type: "list",
      label: "Columns",
      itemLabel: "Column",
      maxItems: 2,
      itemFields: [
        { key: "tag", type: "text", label: "Tag", maxLength: 20, placeholder: "TOPS-DOWN" },
        { key: "head", type: "text", label: "Heading", maxLength: 34 },
        { key: "p1", type: "text", label: "Point 1", maxLength: 60 },
        { key: "p2", type: "text", label: "Point 2", maxLength: 60 },
        { key: "p3", type: "text", label: "Point 3", maxLength: 60 },
        { key: "p4", type: "text", label: "Point 4", maxLength: 60 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "TWO DIRECTIONS, ONE SYSTEM",
    title: "The AI-native way to work.",
    takeaway: "[[You need both.]] Tops-down alone gets ignored. Bottoms-up alone never scales.",
    columns: [
      { tag: "TOPS-DOWN", head: "AI-powered systems.", p1: "AI serves as company infrastructure.", p2: "Critical workflows are codified with AI.", p3: "Built and maintained by AI experts.", p4: "Creates a virtuous cycle of work context." },
      { tag: "BOTTOMS-UP", head: "AI-powered people.", p1: "Naturally embedded in how people work.", p2: "Low or no change-management hurdle.", p3: "Intuitive, easy to get value from.", p4: "Operates with 100% work context." },
    ],
  }),
  render: (f) => {
    const cols = rows(f.columns).slice(0, 2);
    return (
      <Stage background="dark" style={{ padding: "90px 120px 60px", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Kicker>{str(f.kicker)}</Kicker>
            <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 64, letterSpacing: -2, lineHeight: 1.08, margin: "24px 0 0" }}>
              {parseAccents(str(f.title))}
            </h2>
          </div>
          <Logo height={36} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, marginTop: 52, flex: 1, minHeight: 0 }}>
          {cols.map((c, i) => (
            <div key={i} style={{ background: "#1E1E1E", border: "1px solid #33302A", borderRadius: 24, padding: "44px 52px", display: "flex", flexDirection: "column", gap: 26 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 4, color: "var(--coral)", fontWeight: 700 }}>{c.tag}</div>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 44, letterSpacing: -1, lineHeight: 1.1 }}>{c.head}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
                {[c.p1, c.p2, c.p3, c.p4].filter(Boolean).map((p, j) => (
                  <div key={j} style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                    <span style={{ width: 11, height: 11, borderRadius: 3, background: "var(--coral)", flexShrink: 0, position: "relative", top: -6 }} />
                    <span style={{ fontSize: 27, lineHeight: 1.45, color: "var(--body-dark-2)" }}>{p}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        {str(f.takeaway) && (
          <p style={{ fontFamily: "var(--font-title)", fontWeight: 500, fontSize: 32, lineHeight: 1.4, margin: "44px 0 0" }}>
            {parseAccents(str(f.takeaway))}
          </p>
        )}
      </Stage>
    );
  },
};
