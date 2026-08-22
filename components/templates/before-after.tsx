import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Arrow, Bullet, Stat, Rule, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// Before → after as two colour fields meeting at the centre of the stage, with
// the transformation arrow on the seam. `two-column-compare` carried the
// before/after tags but produced no before/after visual.
//
// The split is the design: the stage is divided into two fields rather than
// holding two cards, which is the only place in the deck where the background
// itself does the comparing.
export const beforeAfter: TemplateDef = {
  id: "before-after",
  name: "Before → after",
  description: "A transformation shown as two halves of the stage: the old state and the new one.",
  tags: ["before", "after", "transformation", "change", "old", "new", "impact", "compare", "shift"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 54, hint: "Wrap accent in [[…]]" },
    { key: "beforeLabel", type: "text", label: "Before label", maxLength: 20, placeholder: "TODAY" },
    { key: "afterLabel", type: "text", label: "After label", maxLength: 20, placeholder: "AFTER THE PILOT" },
    { key: "beforeHead", type: "text", label: "Before heading", maxLength: 34 },
    { key: "afterHead", type: "text", label: "After heading", maxLength: 34 },
    { key: "beforeFigure", type: "text", label: "Before figure", maxLength: 10, placeholder: "9 hrs" },
    { key: "afterFigure", type: "text", label: "After figure", maxLength: 10, placeholder: "40 min" },
    { key: "figureLabel", type: "text", label: "Figure label", maxLength: 40, placeholder: "per invoice batch" },
    {
      key: "points",
      type: "list",
      label: "Point pairs",
      itemLabel: "Pair",
      maxItems: 3,
      itemFields: [
        { key: "before", type: "text", label: "Before", maxLength: 54 },
        { key: "after", type: "text", label: "After", maxLength: 54 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "04 · THE IMPACT",
    title: "What actually [[changes]]",
    beforeLabel: "TODAY",
    afterLabel: "AFTER THE PILOT",
    beforeHead: "Silent failures",
    afterHead: "Explicit failures",
    beforeFigure: "9 hrs",
    afterFigure: "40 min",
    figureLabel: "per invoice batch",
    points: [
      { before: "Edge cases break without warning", after: "Every failure path is handled and logged" },
      { before: "One person understands the flow", after: "A runbook your team owns" },
      { before: "Nothing else can safely sit on top", after: "A foundation the roadmap can build on" },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const pairs = rows(f.points);
    // The "before" half recedes, the "after" half is the accent field.
    const beforeFill =
      ctx.background === "cream" ? "var(--cream-sunken)" : ctx.background === "dark" ? "var(--ink-sunken)" : "var(--on-coral-panel)";
    // Tall enough to hold label + heading + figure + caption inside the band.
    // At 260 the figure pushed the caption out under the colour field.
    const HEAD_H = 344;

    const half = (label: string, head: string, figure: string, on: boolean) => (
      <div
        style={{
          flex: 1,
          minWidth: 0,
          background: on ? t.accent : beforeFill,
          color: on ? t.onAccent : t.title,
          padding: "56px 64px",
          display: "flex",
          flexDirection: "column",
          boxSizing: "border-box",
        }}
      >
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: TYPE.kickerSm,
            letterSpacing: 4,
            fontWeight: 700,
            textTransform: "uppercase",
            color: on ? t.onAccent : t.muted,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontFamily: "var(--font-title)",
            fontWeight: 600,
            fontSize: TYPE.h4,
            letterSpacing: titleTracking(TYPE.h4),
            lineHeight: 1.1,
            marginTop: 18,
          }}
        >
          {head}
        </div>
        <Stat
          value={figure}
          size={TYPE.statSm}
          color={on ? t.onAccent : t.accent}
          style={{ marginTop: "auto" }}
        />
        <div
          style={{
            fontSize: TYPE.bodySm,
            color: on ? t.onAccent : t.body,
            marginTop: 12,
            opacity: on ? 0.9 : 1,
          }}
        >
          {str(f.figureLabel)}
        </div>
      </div>
    );

    return (
      <Stage background={ctx.background} padded={false} style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "var(--pad-y) var(--pad-x) 40px" }}>
          <Kicker>{str(f.kicker)}</Kicker>
          <h2
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: TYPE.h3,
              letterSpacing: titleTracking(TYPE.h3),
              lineHeight: 1.06,
              margin: "22px 0 0",
              color: t.title,
            }}
          >
            {parseAccents(str(f.title))}
          </h2>
        </div>

        {/* The two fields run edge to edge — the split is the point. */}
        <div style={{ display: "flex", height: HEAD_H, position: "relative" }}>
          {half(str(f.beforeLabel), str(f.beforeHead), str(f.beforeFigure), false)}
          {half(str(f.afterLabel), str(f.afterHead), str(f.afterFigure), true)}
          {/* Arrow on the seam, in a knocked-out disc so it reads over both. */}
          <div
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 76,
              height: 76,
              marginLeft: -38,
              marginTop: -38,
              borderRadius: "50%",
              background: ctx.background === "cream" ? "var(--cream)" : "var(--ink)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Arrow dir="right" size={34} color={t.accent} />
          </div>
        </div>

        <div style={{ flex: 1, padding: "44px var(--pad-x) var(--pad-y)", display: "flex", flexDirection: "column", minHeight: 0 }}>
          {pairs.map((p, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                minHeight: 0,
                display: "flex",
                alignItems: "center",
                gap: "var(--s6)",
                borderBottom: i < pairs.length - 1 ? `var(--rule-hair) solid ${t.rule}` : "none",
              }}
            >
              <div style={{ flex: 1, display: "flex", gap: 20, alignItems: "baseline" }}>
                <Bullet tone={{ ...t, accent: t.muted }} />
                <span style={{ fontSize: TYPE.body, lineHeight: 1.45, color: t.body }}>{p.before}</span>
              </div>
              <Arrow dir="right" size={22} color={t.muted} />
              <div style={{ flex: 1, display: "flex", gap: 20, alignItems: "baseline" }}>
                <Bullet tone={t} />
                <span style={{ fontSize: TYPE.body, lineHeight: 1.45, color: t.bodyStrong }}>{p.after}</span>
              </div>
            </div>
          ))}
          {pairs.length === 0 && <Rule tone={t} />}
        </div>
      </Stage>
    );
  },
};
