import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, AccentTitle, ImageBox, Logo, tone, TYPE, titleTracking } from "./_shared/primitives";

export const titleHero: TemplateDef = {
  id: "title-hero",
  name: "Title / Hero",
  description: "Open the deck: logo, kicker, one big accented title, subtitle and a hero image.",
  tags: ["title", "cover", "opening", "hero", "intro"],
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "A PRACTICAL PLAYBOOK · 2026" },
    { key: "title", type: "textarea", label: "Title", maxLength: 90, hint: "Wrap the accent word in [[…]]", placeholder: "How to build [[AI-native]] teams." },
    { key: "subtitle", type: "textarea", label: "Subtitle", maxLength: 160 },
    { key: "image", type: "image", label: "Hero image" },
    {
      key: "layout",
      type: "select",
      label: "Layout",
      hint: "Bleed runs the image to the slide edge — the strongest opener.",
      options: [
        { value: "bleed", label: "Image bleeds to the edge" },
        { value: "inset", label: "Image inset in the margin" },
      ],
    },
  ],
  defaults: () => ({
    kicker: "A PRACTICAL PLAYBOOK · 2026",
    title: "How to build [[AI-native]] teams.",
    subtitle: "More output, without more headcount. What that actually takes for a small team.",
    image: "",
    layout: "bleed",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const bleed = str(f.layout, "bleed") === "bleed";
    // The image column is the only element in the deck that reaches the stage
    // edge. That single bleed is what makes the opener read as a cover rather
    // than as the first content slide.
    const imgW = bleed ? 700 : 620;
    return (
      <Stage background={ctx.background} padded={false}>
        <div
          style={{
            position: "absolute",
            left: "var(--pad-x)",
            top: "var(--pad-y)",
            bottom: 80,
            width: 1920 - imgW - 130 - 100,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Logo height={52} />
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "var(--s5)" }}>
            <Kicker>{str(f.kicker)}</Kicker>
            <AccentTitle text={str(f.title)} size={TYPE.hero} style={{ color: t.title }} />
            {/* A short accent rule under the title — the deck's opening mark. */}
            <div style={{ width: 96, height: "var(--rule-2)", background: t.accent }} />
            <p style={{ fontSize: TYPE.h6 + 2, lineHeight: 1.5, color: t.body, margin: 0, maxWidth: 720 }}>
              {str(f.subtitle)}
            </p>
          </div>
        </div>

        <div
          style={
            bleed
              ? { position: "absolute", right: 0, top: 0, bottom: 0, width: imgW }
              : { position: "absolute", right: 120, top: 150, width: imgW, height: 780 }
          }
        >
          <ImageBox
            src={ctx.resolveImage(str(f.image))}
            radius={bleed ? 0 : "var(--r-panel)"}
            placeholder="Drop a team photo"
            tone={t}
          />
          {/* The mark that overlaps the image edge — kept from the reference deck. */}
          <div
            style={{
              position: "absolute",
              left: -22,
              bottom: bleed ? 150 : 64,
              width: 44,
              height: 44,
              borderRadius: "50%",
              background: t.accent,
            }}
          />
        </div>
      </Stage>
    );
  },
};
