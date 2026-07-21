import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead } from "./_shared/primitives";

// A numbered agenda / walkthrough — up to eight items laid out in two columns,
// each a coral numeral, a title and a one-line description. The "Proposal
// Walkthrough" contents slide from the decks.
export const agendaList: TemplateDef = {
  id: "agenda-list",
  name: "Agenda · numbered list",
  description: "A numbered agenda or contents page (up to 8 sections) in two columns.",
  tags: ["agenda", "contents", "walkthrough", "overview", "sections", "outline"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "EXECUTIVE REVIEW" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    {
      key: "items",
      type: "list",
      label: "Agenda items",
      itemLabel: "Item",
      maxItems: 8,
      itemFields: [
        { key: "title", type: "text", label: "Title", maxLength: 40 },
        { key: "desc", type: "text", label: "Subtitle", maxLength: 70 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "EXECUTIVE REVIEW",
    title: "Proposal Walkthrough",
    items: [
      { title: "The Context", desc: "Where you are today" },
      { title: "The Problem", desc: "Why the prototype needs hardening" },
      { title: "The Approach", desc: "Four stages, scope fixed before build" },
      { title: "The Impact", desc: "What changes after the pilot" },
      { title: "Investment", desc: "Indicative, fixed at Discovery" },
      { title: "Our Team", desc: "Who you will work with" },
      { title: "Why Soch", desc: "What makes this low risk" },
      { title: "Next Steps", desc: "From review to kickoff" },
    ],
  }),
  render: (f) => {
    const items = rows(f.items);
    return (
      <Stage background="cream" style={{ padding: "90px 130px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        <div
          style={{
            marginTop: 56,
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridAutoRows: "min-content",
            columnGap: 90,
            rowGap: 6,
          }}
        >
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 26,
                alignItems: "baseline",
                padding: "22px 0",
                borderBottom: "1px solid var(--card-border)",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: 34,
                  color: "var(--coral)",
                  minWidth: 54,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </span>
              <div>
                <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 32, letterSpacing: -0.5 }}>
                  {it.title}
                </div>
                {it.desc && <div style={{ fontSize: 24, color: "var(--body-light)", marginTop: 6 }}>{it.desc}</div>}
              </div>
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
