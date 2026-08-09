import type { TemplateDef } from "./types";
import { str } from "./types";
import { uid } from "@/lib/model/deck";
import type { SlideElement } from "@/lib/model/deck";
import { Stage, Rule, tone, TYPE, titleTracking } from "./_shared/primitives";

export const pullQuote: TemplateDef = {
  id: "pull-quote",
  name: "Pull quote",
  description: "One short, high-impact quote or belief filling the slide.",
  tags: ["quote", "belief", "emotional", "testimonial", "principle"],
  background: "coral",
  fields: [
    {
      key: "quote",
      type: "textarea",
      label: "Quote",
      // 72 chars is roughly three lines at 130px in a 1400px measure. The old
      // cap of 120 overflowed a vertically-centred stage and clipped at both
      // ends — and PPTX does not clip, so it visibly spilled in the export.
      maxLength: 72,
      hint: "Keep it to one breath — this slide is the emotional beat.",
    },
    { key: "attribution", type: "textarea", label: "Attribution", maxLength: 160 },
  ],
  defaults: () => ({
    quote: "Where do we even start?",
    attribution: "Every founder, ops lead, and small-team manager, sometime in the last 18 months.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    return (
      <Stage
        background={ctx.background}
        style={{
          padding: "100px var(--pad-x) 80px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {/* The oversized quote mark, set at low opacity as a ground texture. It
            is a text node, not a pseudo-element — ::before never exports. */}
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontWeight: 700,
            fontSize: 300,
            lineHeight: 0.6,
            color: t.title,
            opacity: 0.35,
            height: 120,
          }}
        >
          &ldquo;
        </div>
        <h1
          style={{
            fontFamily: "var(--font-title)",
            fontWeight: 600,
            fontSize: TYPE.display,
            lineHeight: 1.05,
            letterSpacing: titleTracking(TYPE.display),
            margin: 0,
            maxWidth: 1400,
            color: t.title,
          }}
        >
          {str(f.quote)}
        </h1>
        {str(f.attribution) && (
          <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 72 }}>
            <Rule tone={t} weight="2" color={t.ruleStrong} length={72} />
            <p style={{ fontSize: TYPE.h6, lineHeight: 1.5, margin: 0, color: t.bodyStrong, maxWidth: 900 }}>
              {str(f.attribution)}
            </p>
          </div>
        )}
      </Stage>
    );
  },
  // Positions mirror the centred flow for a three-line quote, so detaching does
  // not visibly jump the slide.
  expand: (f, ctx): SlideElement[] => {
    const t = tone(ctx.background);
    return [
      { id: uid("el"), type: "text", x: 130, y: 250, w: 400, h: 200, rotation: 0,
        style: { fontFamily: "var(--font-title)", fontSize: 300, fontWeight: 700, lineHeight: 0.6, color: t.title, opacity: 0.35 }, content: "“" },
      { id: uid("el"), type: "text", x: 130, y: 400, w: 1400, h: 420, rotation: 0, fieldKey: "quote",
        style: { fontFamily: "var(--font-title)", fontSize: TYPE.display, fontWeight: 600, letterSpacing: titleTracking(TYPE.display), lineHeight: 1.05, color: t.title }, content: str(f.quote) },
      { id: uid("el"), type: "shape", x: 130, y: 856, w: 72, h: 3, rotation: 0, style: { background: t.ruleStrong } },
      { id: uid("el"), type: "text", x: 230, y: 838, w: 900, h: 90, rotation: 0, fieldKey: "attribution",
        style: { fontFamily: "var(--font-body)", fontSize: TYPE.h6, lineHeight: 1.5, color: t.bodyStrong }, content: str(f.attribution) },
    ];
  },
};
