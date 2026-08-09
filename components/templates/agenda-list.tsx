import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Numeral, SlideFooter, tone, TYPE, titleTracking } from "./_shared/primitives";

// A numbered agenda / walkthrough — up to eight items in two columns, each a
// mono numeral, a title and a one-line description, on a hairline rule.
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
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const items = rows(f.items);
    // Rows share the available height rather than stacking at min-content, which
    // is what used to leave a ~350px void under a short agenda.
    const perCol = Math.ceil(Math.max(items.length, 1) / 2);
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "var(--pad-y) var(--pad-x) 128px", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} size={TYPE.h3} tone={t} />
        <div
          style={{
            marginTop: "var(--s6)",
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: `repeat(${perCol}, 1fr)`,
            gridAutoFlow: "column",
            columnGap: 90,
          }}
        >
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 26,
                alignItems: "baseline",
                padding: "18px 0",
                borderBottom: `var(--rule-hair) solid ${t.rule}`,
                minHeight: 0,
              }}
            >
              <Numeral n={i + 1} tone={t} size={TYPE.h6} style={{ minWidth: 58 }} />
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h5 - 4,
                    letterSpacing: titleTracking(TYPE.h5 - 4),
                    color: t.title,
                  }}
                >
                  {it.title}
                </div>
                {it.desc && (
                  <div style={{ fontSize: TYPE.bodySm + 2, color: t.body, marginTop: 6 }}>{it.desc}</div>
                )}
              </div>
            </div>
          ))}
        </div>
        <SlideFooter tone={t} slideNumber={ctx.slideNumber} slideCount={ctx.slideCount} />
      </Stage>
    );
  },
};
