import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Logo } from "./_shared/primitives";

const NUMERALS = ["i.", "ii.", "iii.", "iv."];

export const agenda2x2: TemplateDef = {
  id: "agenda-2x2",
  name: "Agenda · 2×2",
  description: "A four-point agenda or overview laid out as a 2×2 grid with roman numerals.",
  tags: ["agenda", "overview", "contents", "sections", "outline"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "footer", type: "text", label: "Footer label", maxLength: 30 },
    {
      key: "items",
      type: "list",
      label: "Agenda items",
      itemLabel: "Item",
      maxItems: 4,
      itemFields: [
        { key: "head", type: "text", label: "Heading", maxLength: 40 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 90 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "WHAT WE'LL COVER",
    footer: "AI-NATIVE PLAYBOOK",
    items: [
      { head: "Why most AI rollouts fail", desc: "The real reason pilots stall. It's not the tools." },
      { head: "The AI-native framework", desc: "A 2×2 to place your team today, and where it needs to go." },
      { head: "Tops-down and bottoms-up", desc: "What each actually looks like inside a small team." },
      { head: "How to start in four weeks", desc: "The path from audit to first automation." },
    ],
  }),
  render: (f) => {
    const items = rows(f.items).slice(0, 4);
    return (
      <Stage background="cream" style={{ padding: "100px 120px 70px", display: "flex", flexDirection: "column" }}>
        <Kicker>{str(f.kicker)}</Kicker>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", marginTop: 56, flex: 1 }}>
          {items.map((it, i) => (
            <div
              key={i}
              style={{
                borderTop: "2px solid var(--ink)",
                padding: i % 2 === 0 ? "44px 60px 30px 0" : "44px 0 30px 60px",
                display: "flex",
                gap: 36,
              }}
            >
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 26, color: "var(--coral)", fontWeight: 700, minWidth: 60, paddingTop: 8 }}>
                {NUMERALS[i]}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 42, letterSpacing: -1, margin: 0, lineHeight: 1.15 }}>
                  {it.head}
                </h3>
                <p style={{ fontSize: 26, lineHeight: 1.5, color: "var(--body-light)", margin: 0 }}>{it.desc}</p>
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 30 }}>
          <Logo height={32} />
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 3, color: "var(--warm-gray)" }}>
            {str(f.footer)}
          </div>
        </div>
      </Stage>
    );
  },
};
