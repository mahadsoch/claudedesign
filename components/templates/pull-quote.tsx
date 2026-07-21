import type { TemplateDef } from "./types";
import { str } from "./types";
import { uid } from "@/lib/model/deck";
import type { SlideElement } from "@/lib/model/deck";
import { Stage } from "./_shared/primitives";

export const pullQuote: TemplateDef = {
  id: "pull-quote",
  name: "Pull quote",
  description: "One short, high-impact quote or belief on a full coral background.",
  tags: ["quote", "belief", "emotional", "testimonial", "principle"],
  background: "coral",
  fields: [
    { key: "quote", type: "textarea", label: "Quote", maxLength: 120 },
    { key: "attribution", type: "textarea", label: "Attribution", maxLength: 160 },
  ],
  defaults: () => ({
    quote: "Where do we even start?",
    attribution: "Every founder, ops lead, and small-team manager, sometime in the last 18 months.",
  }),
  render: (f) => (
    <Stage
      background="coral"
      style={{ padding: "100px 120px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      <div style={{ fontFamily: "var(--font-title)", fontWeight: 700, fontSize: 300, lineHeight: 0.6, color: "var(--cream)", opacity: 0.35, height: 120 }}>
        &ldquo;
      </div>
      <h1 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 130, lineHeight: 1.05, letterSpacing: -4, margin: 0, maxWidth: 1400 }}>
        {str(f.quote)}
      </h1>
      {str(f.attribution) && (
        <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 72 }}>
          <div style={{ width: 72, height: 3, background: "var(--cream)" }} />
          <p style={{ fontSize: 30, lineHeight: 1.5, margin: 0, opacity: 0.92, maxWidth: 900 }}>{str(f.attribution)}</p>
        </div>
      )}
    </Stage>
  ),
  expand: (f): SlideElement[] => [
    { id: uid("el"), type: "text", x: 120, y: 210, w: 400, h: 200, rotation: 0,
      style: { fontFamily: "var(--font-title)", fontSize: 300, fontWeight: 700, lineHeight: 0.6, color: "var(--cream)", opacity: 0.35 }, content: "“" },
    { id: uid("el"), type: "text", x: 120, y: 360, w: 1400, h: 300, rotation: 0, fieldKey: "quote",
      style: { fontFamily: "var(--font-title)", fontSize: 130, fontWeight: 600, letterSpacing: -4, lineHeight: 1.05, color: "var(--cream)" }, content: str(f.quote) },
    { id: uid("el"), type: "shape", x: 120, y: 730, w: 72, h: 3, rotation: 0, style: { background: "var(--cream)" } },
    { id: uid("el"), type: "text", x: 220, y: 712, w: 900, h: 90, rotation: 0, fieldKey: "attribution",
      style: { fontFamily: "var(--font-body)", fontSize: 30, lineHeight: 1.5, color: "var(--cream)", opacity: 0.92 }, content: str(f.attribution) },
  ],
};
