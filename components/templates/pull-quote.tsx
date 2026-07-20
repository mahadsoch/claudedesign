import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage } from "./_shared/primitives";

export const pullQuote: TemplateDef = {
  id: "pull-quote",
  name: "Pull quote",
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
};
