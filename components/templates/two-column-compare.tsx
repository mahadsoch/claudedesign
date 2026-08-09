import { Fragment } from "react";
import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Logo, Card, Bullet, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// Two options or states side by side, with a divider carrying the relationship
// between them ("vs" / "→"), so the slide reads as a comparison rather than as
// two unrelated cards.
//
// Note: the points are four scalar fields rather than a nested list because the
// Inspector renders `itemFields` as flat inputs — a list inside a list row
// would need recursive list support first.
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
      key: "relation",
      type: "select",
      label: "Relationship",
      options: [
        { value: "vs", label: "Versus (two options)" },
        { value: "then", label: "Before → after" },
        { value: "none", label: "No divider" },
      ],
    },
    {
      key: "emphasis",
      type: "select",
      label: "Emphasis",
      options: [
        { value: "none", label: "Both equal" },
        { value: "right", label: "Favour the right column" },
        { value: "left", label: "Favour the left column" },
      ],
    },
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
    relation: "vs",
    emphasis: "none",
    columns: [
      { tag: "TOPS-DOWN", head: "AI-powered systems.", p1: "AI serves as company infrastructure.", p2: "Critical workflows are codified with AI.", p3: "Built and maintained by AI experts.", p4: "Creates a virtuous cycle of work context." },
      { tag: "BOTTOMS-UP", head: "AI-powered people.", p1: "Naturally embedded in how people work.", p2: "Low or no change-management hurdle.", p3: "Intuitive, easy to get value from.", p4: "Operates with 100% work context." },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const cols = rows(f.columns).slice(0, 2);
    const relation = str(f.relation, "vs");
    const emphasis = str(f.emphasis, "none");
    const divider = relation === "vs" ? "vs" : relation === "then" ? "→" : "";
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 60px", display: "flex", flexDirection: "column" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <Kicker>{str(f.kicker)}</Kicker>
            <h2
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: TYPE.h3 + 4,
                letterSpacing: titleTracking(TYPE.h3 + 4),
                lineHeight: 1.08,
                margin: "24px 0 0",
                color: t.title,
              }}
            >
              {parseAccents(str(f.title))}
            </h2>
          </div>
          <Logo height={36} />
        </div>
        <div style={{ display: "flex", alignItems: "stretch", gap: 28, marginTop: 52, flex: 1, minHeight: 0 }}>
          {cols.map((c, i) => {
            const favoured =
              (emphasis === "left" && i === 0) || (emphasis === "right" && i === 1);
            return (
              <Fragment key={i}>
                {i === 1 && divider && (
                  <div
                    style={{
                      alignSelf: "center",
                      fontFamily: "var(--font-mono)",
                      fontSize: TYPE.h6,
                      fontWeight: 700,
                      color: t.accent,
                      textTransform: "uppercase",
                      letterSpacing: 2,
                    }}
                  >
                    {divider}
                  </div>
                )}
                <Card
                  tone={t}
                  emphasis={favoured ? "accent" : "none"}
                  style={{ flex: favoured ? 1.15 : 1, gap: 26, padding: "44px 52px", minWidth: 0 }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: TYPE.kicker,
                      letterSpacing: 4,
                      fontWeight: 700,
                      color: favoured ? t.onAccent : t.accent,
                    }}
                  >
                    {c.tag}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-title)",
                      fontWeight: 600,
                      fontSize: TYPE.h4,
                      letterSpacing: titleTracking(TYPE.h4),
                      lineHeight: 1.1,
                    }}
                  >
                    {c.head}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 8 }}>
                    {[c.p1, c.p2, c.p3, c.p4].filter(Boolean).map((p, j) => (
                      <div key={j} style={{ display: "flex", gap: 20, alignItems: "baseline" }}>
                        <Bullet tone={favoured ? { ...t, accent: t.onAccent } : t} />
                        <span
                          style={{
                            fontSize: TYPE.body + 1,
                            lineHeight: 1.45,
                            color: favoured ? t.onAccent : t.bodyStrong,
                          }}
                        >
                          {p}
                        </span>
                      </div>
                    ))}
                  </div>
                </Card>
              </Fragment>
            );
          })}
        </div>
        {str(f.takeaway) && (
          <p
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 500,
              fontSize: TYPE.h5 - 4,
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
