import type { TemplateDef } from "./types";
import { str } from "./types";
import { uid } from "@/lib/model/deck";
import type { SlideElement } from "@/lib/model/deck";
import { Stage, Kicker, AccentTitle, ImageBox, Logo, Button, tone, TYPE, titleTracking } from "./_shared/primitives";

// The closing bookend to `title-hero`: same lockup, same bleed, same coral mark
// overlapping the image edge — so the deck opens and closes on the same note.
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
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const IMG_W = 700;
    return (
      <Stage background={ctx.background} padded={false}>
        <div
          style={{
            position: "absolute",
            left: "var(--pad-x)",
            top: "var(--pad-y)",
            bottom: 80,
            right: IMG_W + 100,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Logo height={52} />
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 36 }}>
            <Kicker>{str(f.kicker)}</Kicker>
            <AccentTitle text={str(f.title)} size={TYPE.h1 + 4} style={{ color: t.title }} />
            <p style={{ fontSize: TYPE.h6 + 2, lineHeight: 1.5, color: t.body, margin: 0 }}>
              {str(f.subtitle)}
            </p>
            <div style={{ display: "flex", alignItems: "center", gap: 36, marginTop: 12, flexWrap: "wrap" }}>
              <Button tone={t}>{str(f.ctaLabel)}</Button>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: TYPE.body - 1,
                  letterSpacing: 1,
                  color: t.bodyStrong,
                }}
              >
                {str(f.contact)}
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: IMG_W }}>
          <ImageBox
            src={ctx.resolveImage(str(f.image))}
            radius={0}
            placeholder="Drop a closing image"
            tone={t}
          />
          <div
            style={{
              position: "absolute",
              left: -22,
              bottom: 150,
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
  expand: (f, ctx): SlideElement[] => {
    const t = tone(ctx.background);
    const size = TYPE.h1 + 4;
    return [
      { id: uid("el"), type: "image", x: 130, y: 90, w: 180, h: 52, rotation: 0, style: { objectFit: "contain" }, content: "/assets/soch-logo.png" },
      { id: uid("el"), type: "text", x: 130, y: 470, w: 1000, h: 34, rotation: 0, fieldKey: "kicker",
        style: { fontFamily: "var(--font-mono)", fontSize: TYPE.kicker, letterSpacing: 5, fontWeight: 500, textTransform: "uppercase", color: t.accent }, content: str(f.kicker) },
      { id: uid("el"), type: "text", x: 130, y: 528, w: 1000, h: 200, rotation: 0, fieldKey: "title",
        // Tracking comes from the shared ramp, so this can no longer drift from
        // what `render` produces.
        style: { fontFamily: "var(--font-title)", fontSize: size, fontWeight: 600, letterSpacing: titleTracking(size), lineHeight: 1.05, color: t.title }, content: str(f.title) },
      { id: uid("el"), type: "text", x: 130, y: 760, w: 900, h: 50, rotation: 0, fieldKey: "subtitle",
        style: { fontFamily: "var(--font-body)", fontSize: TYPE.h6 + 2, lineHeight: 1.5, color: t.body }, content: str(f.subtitle) },
      { id: uid("el"), type: "text", x: 130, y: 840, w: 320, h: 76, rotation: 0, fieldKey: "ctaLabel",
        style: { fontFamily: "var(--font-title)", fontSize: 28, fontWeight: 600, background: t.accent, color: t.onAccent, borderRadius: 999, textAlign: "center", padding: "22px 20px" }, content: str(f.ctaLabel) },
      { id: uid("el"), type: "text", x: 480, y: 862, w: 700, h: 40, rotation: 0, fieldKey: "contact",
        style: { fontFamily: "var(--font-mono)", fontSize: TYPE.body - 1, letterSpacing: 1, color: t.bodyStrong }, content: str(f.contact) },
      { id: uid("el"), type: "image", x: 1220, y: 0, w: 700, h: 1080, rotation: 0, style: { objectFit: "cover" }, content: str(f.image) },
      { id: uid("el"), type: "shape", x: 1198, y: 886, w: 44, h: 44, rotation: 0, style: { background: t.accent, borderRadius: 9999 } },
    ];
  },
};
