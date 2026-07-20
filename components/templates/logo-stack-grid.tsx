import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, ImageBox, parseAccents } from "./_shared/primitives";

export const logoStackGrid: TemplateDef = {
  id: "logo-stack-grid",
  name: "Logo / tool grid",
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 70, hint: "Wrap accent in [[…]]" },
    { key: "caption", type: "textarea", label: "Caption", maxLength: 120 },
    {
      key: "logos",
      type: "list",
      label: "Logos",
      itemLabel: "Logo",
      maxItems: 12,
      itemFields: [
        { key: "image", type: "image", label: "Logo image" },
        { key: "name", type: "text", label: "Name", maxLength: 20 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "THE STACK PROBLEM",
    title: "You have more tools than you can [[keep track of.]]",
    caption: "Every tool adds context that lives in a different place. None of them talk to each other.",
    logos: [
      { image: "", name: "Slack" },
      { image: "", name: "Notion" },
      { image: "", name: "Asana" },
      { image: "", name: "Drive" },
      { image: "", name: "Figma" },
      { image: "", name: "Sheets" },
    ],
  }),
  render: (f, ctx) => {
    const logos = rows(f.logos);
    const cols = Math.min(Math.max(Math.ceil(Math.sqrt(logos.length)), 3), 6);
    return (
      <Stage background="cream" style={{ padding: "90px 120px 70px", display: "flex", flexDirection: "column" }}>
        <Kicker>{str(f.kicker)}</Kicker>
        <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 64, letterSpacing: -2, lineHeight: 1.08, margin: "24px 0 0", maxWidth: 1400 }}>
          {parseAccents(str(f.title))}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gap: 22,
            marginTop: 52,
            flex: 1,
            minHeight: 0,
            alignContent: "center",
          }}
        >
          {logos.map((l, i) => (
            <div
              key={i}
              style={{
                background: "var(--card-fill)",
                border: "1.5px solid var(--card-border)",
                borderRadius: 20,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                padding: 24,
                minHeight: 150,
              }}
            >
              <div style={{ width: 72, height: 72 }}>
                <ImageBox src={ctx.resolveImage(str(l.image))} radius={14} placeholder="logo" />
              </div>
              {l.name && <div style={{ fontFamily: "var(--font-mono)", fontSize: 20, letterSpacing: 1, color: "var(--body-light)" }}>{l.name}</div>}
            </div>
          ))}
        </div>
        {str(f.caption) && (
          <p style={{ fontSize: 28, lineHeight: 1.5, color: "var(--body-light)", margin: "36px 0 0", maxWidth: 1100 }}>{str(f.caption)}</p>
        )}
      </Stage>
    );
  },
};
