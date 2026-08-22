import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, IconChip, Kicker, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// "What changes after the pilot": outcomes on the left, and a highlight field
// on the right that bleeds to the top and bottom edges. The bleed is what
// separates this slide's silhouette from `context-stat-rail`, which uses an
// inset panel in the same position — the two used to look identical.
export const impactHighlight: TemplateDef = {
  id: "impact-highlight",
  name: "Impact + highlight field",
  description: "A list of outcomes beside a highlighted field that calls out the one metric to chase.",
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
    // Previously hardcoded to `icon:target` and not editable.
    { key: "panelIcon", type: "image", label: "Panel icon", picker: "icon" },
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
    panelIcon: "icon:target",
    panelKicker: "THE METRIC TO CHASE",
    panelTitle: "Efficiency and optimisation",
    panelBody: "The pilot's success is measured on how much faster and cleaner the process runs once it is live.",
    panelFigure: "Save [[€180k–€350k]] a year if 3–5% of losses are recovered.",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const items = rows(f.items);
    const FIELD_W = 620;
    const fieldFill =
      ctx.background === "cream"
        ? "var(--coral-wash)"
        : ctx.background === "dark"
          ? "var(--ink-raised)"
          : "var(--on-coral-panel)";
    return (
      <Stage background={ctx.background} padded={false}>
        <div
          style={{
            position: "absolute",
            left: "var(--pad-x)",
            top: "var(--pad-y)",
            bottom: "var(--pad-y)",
            right: FIELD_W + 80,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <SectionHead kicker={str(f.kicker)} title={str(f.title)} tone={t} />
          <div
            style={{
              marginTop: "var(--s6)",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              minHeight: 0,
            }}
          >
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 24, alignItems: "flex-start" }}>
                <IconChip value={str(it.icon)} resolve={ctx.resolveImage} tone={t} size={56} radius={12} />
                <div>
                  <div
                    style={{
                      fontFamily: "var(--font-title)",
                      fontWeight: 600,
                      fontSize: TYPE.h6 - 3,
                      letterSpacing: titleTracking(TYPE.h6),
                      color: t.title,
                    }}
                  >
                    {it.head}
                  </div>
                  <p style={{ fontSize: TYPE.bodySm, lineHeight: 1.5, color: t.body, margin: "8px 0 0" }}>
                    {it.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Full-height colour field, flush to the right edge. */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: FIELD_W,
            background: fieldFill,
            padding: "var(--pad-y) 64px",
            display: "flex",
            flexDirection: "column",
            boxSizing: "border-box",
          }}
        >
          <IconChip
            value={str(f.panelIcon, "icon:target")}
            resolve={ctx.resolveImage}
            tone={t}
            size={56}
            radius={12}
          />
          <div style={{ marginTop: 30 }}>
            <Kicker>{str(f.panelKicker)}</Kicker>
          </div>
          <h3
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.h4,
              letterSpacing: titleTracking(TYPE.h4),
              lineHeight: 1.1,
              margin: "18px 0 0",
              color: t.title,
            }}
          >
            {str(f.panelTitle)}
          </h3>
          <p style={{ fontSize: TYPE.bodySm + 1, lineHeight: 1.5, color: t.body, margin: "22px 0 0" }}>
            {str(f.panelBody)}
          </p>
          <p
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.body,
              lineHeight: 1.35,
              margin: "auto 0 0",
              color: t.title,
            }}
          >
            {parseAccents(str(f.panelFigure))}
          </p>
        </div>
      </Stage>
    );
  },
};
