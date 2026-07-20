import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, AccentTitle, ImageBox, Logo } from "./_shared/primitives";

export const contactCta: TemplateDef = {
  id: "contact-cta",
  name: "Contact / CTA",
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
};
