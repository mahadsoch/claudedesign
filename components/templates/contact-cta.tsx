import type { TemplateDef } from "./types";
import { str } from "./types";
import { uid } from "@/lib/model/deck";
import type { SlideElement } from "@/lib/model/deck";
import { Stage, Kicker, AccentTitle, ImageBox, Logo } from "./_shared/primitives";

export const contactCta: TemplateDef = {
  id: "contact-cta",
  name: "Contact / CTA",
  description: "Close the deck: a call to action, contact line and closing image.",
  tags: ["contact", "cta", "closing", "end", "book"],
  background: "dark",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 70, hint: "Wrap accent in [[…]]" },
    { key: "subtitle", type: "textarea", label: "Subtitle", maxLength: 100 },
    { key: "ctaLabel", type: "text", label: "Button label", maxLength: 24 },
    { key: "contact", type: "text", label: "Contact line", maxLength: 60 },
    { key: "image", type: "image", label: "Closing image" },
  ],
  defaults: () => ({
    kicker: "GET IN TOUCH",
    title: "Ready to eliminate the chaos?",
    subtitle: "More growth, less chaos.",
    ctaLabel: "Book a call",
    contact: "withsoch.com · info@withsoch.com",
    image: "",
  }),
  render: (f, ctx) => (
    <Stage background="dark" style={{ padding: "90px 120px 80px", display: "flex", gap: 100 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Logo height={52} />
        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 36, paddingBottom: 20 }}>
          <Kicker>{str(f.kicker)}</Kicker>
          <AccentTitle text={str(f.title)} size={92} />
          <p style={{ fontSize: 32, lineHeight: 1.5, color: "var(--body-dark)", margin: 0 }}>{str(f.subtitle)}</p>
          <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 12 }}>
            <span
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: 28,
                letterSpacing: 0.5,
                background: "var(--coral)",
                color: "var(--cream)",
                padding: "22px 52px",
                borderRadius: 999,
                display: "inline-block",
              }}
            >
              {str(f.ctaLabel)}
            </span>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 25, letterSpacing: 1, color: "var(--body-dark-3)" }}>
              {str(f.contact)}
            </div>
          </div>
        </div>
      </div>
      <div style={{ flex: "0 0 560px", minWidth: 0, position: "relative", display: "flex", alignItems: "center" }}>
        <div style={{ position: "relative", width: "100%", height: 760 }}>
          <ImageBox src={ctx.resolveImage(str(f.image))} placeholder="Drop a closing image" />
        </div>
      </div>
    </Stage>
  ),
  expand: (f): SlideElement[] => [
    { id: uid("el"), type: "image", x: 120, y: 90, w: 180, h: 52, rotation: 0, style: { objectFit: "contain" }, content: "/assets/soch-logo.png" },
    { id: uid("el"), type: "text", x: 120, y: 470, w: 1000, h: 34, rotation: 0, fieldKey: "kicker",
      style: { fontFamily: "var(--font-mono)", fontSize: 24, letterSpacing: 5, fontWeight: 500, textTransform: "uppercase", color: "var(--coral)" }, content: str(f.kicker) },
    { id: uid("el"), type: "text", x: 120, y: 528, w: 1000, h: 200, rotation: 0, fieldKey: "title",
      style: { fontFamily: "var(--font-title)", fontSize: 92, fontWeight: 600, letterSpacing: -3, lineHeight: 1.05, color: "var(--cream)" }, content: str(f.title) },
    { id: uid("el"), type: "text", x: 120, y: 760, w: 900, h: 50, rotation: 0, fieldKey: "subtitle",
      style: { fontFamily: "var(--font-body)", fontSize: 32, lineHeight: 1.5, color: "var(--body-dark)" }, content: str(f.subtitle) },
    { id: uid("el"), type: "text", x: 120, y: 840, w: 320, h: 76, rotation: 0, fieldKey: "ctaLabel",
      style: { fontFamily: "var(--font-title)", fontSize: 28, fontWeight: 600, letterSpacing: 0.5, background: "var(--coral)", color: "var(--cream)", borderRadius: 999, textAlign: "center", padding: "22px 20px" }, content: str(f.ctaLabel) },
    { id: uid("el"), type: "text", x: 470, y: 862, w: 700, h: 40, rotation: 0, fieldKey: "contact",
      style: { fontFamily: "var(--font-mono)", fontSize: 25, letterSpacing: 1, color: "var(--body-dark-3)" }, content: str(f.contact) },
    { id: uid("el"), type: "image", x: 1240, y: 160, w: 560, h: 760, rotation: 0, style: { borderRadius: 24, objectFit: "cover" }, content: str(f.image) },
  ],
};
