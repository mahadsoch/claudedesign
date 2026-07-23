import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, IconChip, Kicker } from "./_shared/primitives";

// "What changes after the pilot": a list of outcomes on the left, and a
// coral-wash panel on the right calling out the single metric to chase.
export const impactHighlight: TemplateDef = {
  id: "impact-highlight",
  name: "Impact + highlight panel",
  description: "A list of outcomes beside a highlighted panel that calls out the one metric to chase.",
  tags: ["impact", "outcomes", "benefits", "metric", "results", "after", "highlight"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "04 · THE IMPACT" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    {
      key: "items",
      type: "list",
      label: "Outcomes",
      itemLabel: "Outcome",
      maxItems: 4,
      itemFields: [
        { key: "icon", type: "image", label: "Icon", picker: "icon" },
        { key: "head", type: "text", label: "Heading", maxLength: 44 },
        { key: "desc", type: "textarea", label: "Description", maxLength: 120 },
      ],
    },
    { key: "panelKicker", type: "text", label: "Panel label", maxLength: 30 },
    { key: "panelTitle", type: "textarea", label: "Panel title", maxLength: 48 },
    { key: "panelBody", type: "textarea", label: "Panel body", maxLength: 200 },
    { key: "panelFigure", type: "textarea", label: "Panel figure line", maxLength: 90, hint: "Wrap accent in [[…]]" },
  ],
  defaults: () => ({
    kicker: "04 · THE IMPACT",
    title: "What changes after the pilot",
    items: [
      { icon: "icon:shield", head: "Production-grade, owned by you", desc: "Runs on your stack with explicit error paths, monitored and tested." },
      { icon: "icon:chart", head: "Predictable failure rate", desc: "Edge cases are handled and known, so the team can trust what it sees." },
      { icon: "icon:book", head: "A runbook your team can maintain", desc: "Documentation owned by your people, so maintenance can move in-house." },
      { icon: "icon:layers", head: "A foundation ready to extend", desc: "The next automations on the roadmap build on solid ground." },
    ],
    panelKicker: "THE METRIC TO CHASE",
    panelTitle: "Efficiency and optimisation",
    panelBody: "The pilot's success is measured on how much faster and cleaner the process runs once it is live.",
    panelFigure: "Save [[€180k–€350k]] a year if 3–5% of losses are recovered.",
  }),
  render: (f, ctx) => {
    const items = rows(f.items);
    return (
      <Stage background="cream" style={{ padding: "90px 130px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} />
        <div style={{ marginTop: 52, flex: 1, display: "flex", gap: 80, minHeight: 0 }}>
          <div style={{ flex: 1.15, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <IconChip value={str(it.icon)} resolve={ctx.resolveImage} size={56} radius={12} />
                <div>
                  <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 27, letterSpacing: -0.5 }}>{it.head}</div>
                  <p style={{ fontSize: 22, lineHeight: 1.5, color: "var(--body-light)", margin: "8px 0 0" }}>{it.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div style={{ flex: "0 0 540px", background: "var(--coral-wash)", borderRadius: 24, padding: "52px 54px", display: "flex", flexDirection: "column" }}>
            <IconChip value="icon:target" size={56} radius={12} />
            <div style={{ marginTop: 30 }}>
              <Kicker>{str(f.panelKicker)}</Kicker>
            </div>
            <h3 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 46, letterSpacing: -1.5, lineHeight: 1.1, margin: "18px 0 0", color: "var(--ink)" }}>
              {str(f.panelTitle)}
            </h3>
            <p style={{ fontSize: 23, lineHeight: 1.5, color: "var(--body-light)", margin: "22px 0 0" }}>{str(f.panelBody)}</p>
            <p style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 26, lineHeight: 1.35, margin: "auto 0 0", color: "var(--ink)" }}>
              {str(f.panelFigure).split(/(\[\[.+?\]\])/).map((seg, j) =>
                seg.startsWith("[[") ? (
                  <span key={j} style={{ color: "var(--coral)" }}>{seg.slice(2, -2)}</span>
                ) : (
                  seg
                )
              )}
            </p>
          </div>
        </div>
      </Stage>
    );
  },
};
