import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, Rule, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// A chapter break. The deck had no dedicated divider at all, so `statement` was
// being asked to do the job — which is also why long decks read as one
// undifferentiated run of content slides.
//
// The oversized numeral is the whole design: it bleeds off the right edge, sets
// the section number at a scale nothing else in the deck reaches, and gives the
// background rhythm a natural place to go dark or coral.
export const sectionDivider: TemplateDef = {
  id: "section-divider",
  name: "Section divider",
  description: "A chapter break between sections: a big section number and the section title.",
  tags: ["section", "divider", "chapter", "break", "part", "transition", "agenda"],
  background: "dark",
  fields: [
    { key: "number", type: "text", label: "Section number", maxLength: 3, placeholder: "02" },
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "PART TWO" },
    { key: "title", type: "textarea", label: "Section title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "summary", type: "textarea", label: "Summary", maxLength: 160 },
  ],
  defaults: () => ({
    number: "02",
    kicker: "PART TWO",
    title: "The [[approach]]",
    summary: "Four stages, with scope and price fixed before any build begins.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    return (
      <Stage background={ctx.background} style={{ display: "flex", flexDirection: "column" }}>
        {/* The numeral runs off the right edge — the deck's one true bleed. */}
        {str(f.number) && (
          <div
            style={{
              position: "absolute",
              right: -80,
              top: "50%",
              transform: "translateY(-50%)",
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: 720,
              lineHeight: 0.75,
              letterSpacing: -40,
              color: t.accent,
              opacity: ctx.background === "coral" ? 0.22 : 0.16,
            }}
          >
            {str(f.number)}
          </div>
        )}

        <div style={{ marginTop: "auto", marginBottom: "auto", position: "relative", maxWidth: 1180 }}>
          <Kicker>{str(f.kicker)}</Kicker>
          <h1
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.hero + 16,
              lineHeight: 1.03,
              letterSpacing: titleTracking(TYPE.hero + 16),
              margin: "36px 0 0",
              color: t.title,
            }}
          >
            {parseAccents(str(f.title))}
          </h1>
          {str(f.summary) && (
            <>
              <Rule tone={t} weight="heavy" color={t.accent} length={200} style={{ margin: "48px 0 40px" }} />
              <p style={{ fontSize: TYPE.h6, lineHeight: 1.5, color: t.body, margin: 0, maxWidth: 820 }}>
                {str(f.summary)}
              </p>
            </>
          )}
        </div>
      </Stage>
    );
  },
};
