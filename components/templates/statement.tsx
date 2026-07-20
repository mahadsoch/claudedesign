import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, parseAccents } from "./_shared/primitives";

export const statement: TemplateDef = {
  id: "statement",
  name: "Statement",
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "statement", type: "textarea", label: "Statement", maxLength: 130, hint: "Wrap the accent in [[…]]" },
  ],
  defaults: () => ({
    kicker: "THE ONE THING TO REMEMBER",
    statement: "Layering AI onto a broken system [[will never work.]]",
  }),
  render: (f) => (
    <Stage
      background="dark"
      style={{ padding: "100px 120px 80px", display: "flex", flexDirection: "column", justifyContent: "center" }}
    >
      {str(f.kicker) && <Kicker style={{ opacity: 0.9 }}>{str(f.kicker)}</Kicker>}
      <h1
        style={{
          fontFamily: "var(--font-title)",
          fontWeight: 600,
          fontSize: 112,
          lineHeight: 1.08,
          letterSpacing: -3.5,
          margin: "48px 0 0",
          maxWidth: 1560,
        }}
      >
        {parseAccents(str(f.statement))}
      </h1>
    </Stage>
  ),
};
