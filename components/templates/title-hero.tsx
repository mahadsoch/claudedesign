import type { TemplateDef } from "./types";
import { str } from "./types";
import { uid } from "@/lib/model/deck";
import type { SlideElement } from "@/lib/model/deck";
import { Stage, Kicker, AccentTitle, ImageBox, Logo } from "./_shared/primitives";

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
  ],
  defaults: () => ({
    kicker: "A PRACTICAL PLAYBOOK · 2026",
    title: "How to build [[AI-native]] teams.",
    subtitle: "More output, without more headcount. What that actually takes for a small team.",
    image: "",
  }),
  render: (f, ctx) => (
    <Stage background="dark" style={{ padding: "90px 120px 80px", display: "flex", gap: 100 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Logo height={52} />
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 40, paddingBottom: 30 }}>
          <Kicker>{str(f.kicker)}</Kicker>
          <AccentTitle text={str(f.title)} size={104} />
          <p style={{ fontSize: 32, lineHeight: 1.5, color: "var(--body-dark)", margin: 0, maxWidth: 720 }}>
            {str(f.subtitle)}
          </p>
        </div>
      </div>
      <div style={{ flex: "0 0 620px", minWidth: 0, position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", width: "100%", height: 780 }}>
          <ImageBox src={ctx.resolveImage(str(f.image))} placeholder="Drop a team photo" />
          <div style={{ position: "absolute", left: -22, bottom: 64, width: 44, height: 44, borderRadius: "50%", background: "var(--coral)" }} />
        </div>
      </div>
    </Stage>
  ),
  expand: (f): SlideElement[] => [
    { id: uid("el"), type: "image", x: 120, y: 90, w: 180, h: 52, rotation: 0, style: { objectFit: "contain" }, content: "/assets/soch-logo.png" },
    { id: uid("el"), type: "text", x: 120, y: 542, w: 960, h: 34, rotation: 0, fieldKey: "kicker",
      style: { fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 5, fontWeight: 500, textTransform: "uppercase", color: "var(--coral)" }, content: str(f.kicker) },
    { id: uid("el"), type: "text", x: 120, y: 600, w: 980, h: 240, rotation: 0, fieldKey: "title",
      style: { fontFamily: "var(--font-title)", fontSize: 104, fontWeight: 600, letterSpacing: -4, lineHeight: 1.05, color: "var(--cream)" }, content: str(f.title) },
    { id: uid("el"), type: "text", x: 120, y: 870, w: 720, h: 100, rotation: 0, fieldKey: "subtitle",
      style: { fontFamily: "var(--font-body)", fontSize: 32, lineHeight: 1.5, color: "var(--body-dark)" }, content: str(f.subtitle) },
    { id: uid("el"), type: "image", x: 1180, y: 150, w: 620, h: 780, rotation: 0, style: { borderRadius: 24, objectFit: "cover" }, content: str(f.image) },
    { id: uid("el"), type: "shape", x: 1158, y: 822, w: 44, h: 44, rotation: 0, style: { background: "var(--coral)", borderRadius: 9999 } },
  ],
};
