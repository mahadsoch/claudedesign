import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, Portrait, Rule, Stat, tone, TYPE, titleTracking } from "./_shared/primitives";

// A testimonial with a face on it. `pull-quote` is the anonymous, emotional
// beat; this is the attributed one — a named person, their company, and the
// result they are vouching for.
export const quotePortrait: TemplateDef = {
  id: "quote-portrait",
  name: "Testimonial · with portrait",
  description: "An attributed client quote with a headshot, role and the result it backs up.",
  tags: ["testimonial", "quote", "client", "reference", "proof", "social proof", "review", "endorsement"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "quote", type: "textarea", label: "Quote", maxLength: 200 },
    { key: "photo", type: "image", label: "Headshot" },
    { key: "name", type: "text", label: "Name", maxLength: 28 },
    { key: "role", type: "text", label: "Role & company", maxLength: 44 },
    { key: "figure", type: "text", label: "Result figure", maxLength: 10, placeholder: "−42%" },
    { key: "figureLabel", type: "text", label: "Result label", maxLength: 44 },
  ],
  defaults: () => ({
    kicker: "IN THEIR WORDS",
    quote: "We had tried automating this twice before. The difference this time was that the failure paths were designed in from the start.",
    photo: "",
    name: "Raphael Braga",
    role: "Head of Procurement, Leadtech",
    figure: "−42%",
    figureLabel: "stockouts in 12 weeks",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    return (
      <Stage background={ctx.background} style={{ display: "flex", gap: 90 }}>
        <div style={{ flex: 1.5, minWidth: 0, display: "flex", flexDirection: "column" }}>
          <Kicker>{str(f.kicker)}</Kicker>
          <div
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 700,
              fontSize: 200,
              lineHeight: 0.55,
              height: 84,
              color: t.accent,
              marginTop: 44,
            }}
          >
            &ldquo;
          </div>
          <blockquote
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.h4 + 4,
              lineHeight: 1.22,
              letterSpacing: titleTracking(TYPE.h4),
              margin: "36px 0 0",
              color: t.title,
            }}
          >
            {str(f.quote)}
          </blockquote>

          <div style={{ marginTop: "auto" }}>
            <Rule tone={t} weight="1" color={t.ruleStrong} style={{ marginBottom: 28 }} />
            <div style={{ display: "flex", alignItems: "flex-end", gap: "var(--s7)" }}>
              <div>
                <div
                  style={{
                    fontFamily: "var(--font-title)",
                    fontWeight: 600,
                    fontSize: TYPE.h6,
                    color: t.title,
                  }}
                >
                  {str(f.name)}
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: TYPE.kickerSm,
                    letterSpacing: 2,
                    textTransform: "uppercase",
                    color: t.muted,
                    marginTop: 8,
                  }}
                >
                  {str(f.role)}
                </div>
              </div>
              {str(f.figure) && (
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <Stat value={str(f.figure)} size={TYPE.statSm} color={t.accent} />
                  <div style={{ fontSize: TYPE.bodySm, color: t.body, marginTop: 8 }}>{str(f.figureLabel)}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ flex: "0 0 480px", minHeight: 0 }}>
          <Portrait src={ctx.resolveImage(str(f.photo))} name={str(f.name)} tone={t} radius="var(--r-card)" />
        </div>
      </Stage>
    );
  },
};
