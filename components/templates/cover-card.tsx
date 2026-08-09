import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, ImageBox, Logo, Rule, Pill, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// Cover with an inset card floating in the stage field — the "Executive Review"
// opener. The card is the *inverse* of the slide background, so the device
// works on cream (ink card), on ink (cream card) and on coral (ink card).
export const coverCard: TemplateDef = {
  id: "cover-card",
  name: "Cover · inset card",
  description: "A proposal cover: an inset card with a title, 'prepared for' line and author.",
  tags: ["cover", "title", "opening", "proposal", "intro"],
  background: "cream",
  fields: [
    { key: "title", type: "textarea", label: "Title", maxLength: 80, hint: "Wrap accent in [[…]]" },
    { key: "preparedFor", type: "text", label: "Prepared-for line", maxLength: 60 },
    { key: "author", type: "text", label: "Author line", maxLength: 40 },
    { key: "image", type: "image", label: "Portrait / cover image" },
  ],
  defaults: () => ({
    title: "Leadtech [[Procurement Automation]]",
    preparedFor: "Proposal Prepared for: Raphael Braga",
    author: "By: Rizwan Mahmood",
    image: "",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const img = ctx.resolveImage(str(f.image));
    // The card inverts the field. On cream that is the familiar ink card; on ink
    // and coral it becomes a cream card, which reads just as deliberately.
    const cardBg = ctx.background === "cream" ? "var(--ink)" : "var(--cream)";
    const cardInk = ctx.background === "cream" ? "var(--cream)" : "var(--ink)";
    const cardBody = ctx.background === "cream" ? "var(--body-dark)" : "var(--body-light)";
    const cardRule =
      ctx.background === "cream" ? "rgba(252,245,235,0.20)" : "rgba(20,20,20,0.16)";
    // A 3:4 frame instead of the old 300×620 letterbox, which cropped faces.
    const imgW = 380;
    return (
      <Stage background={ctx.background} style={{ padding: 72 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: cardBg,
            color: cardInk,
            borderRadius: 28,
            padding: "72px 84px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxSizing: "border-box",
          }}
        >
          <Logo height={44} />

          <div style={{ marginTop: "auto", maxWidth: img ? 1090 : "100%" }}>
            <Rule tone={t} color={cardRule} style={{ marginBottom: 54 }} />
            <h1
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: TYPE.h1 + 4,
                letterSpacing: titleTracking(TYPE.h1 + 4),
                lineHeight: 1.04,
                margin: 0,
              }}
            >
              {parseAccents(str(f.title))}
            </h1>
            <p style={{ fontSize: TYPE.h6, color: cardBody, margin: "34px 0 0" }}>
              {str(f.preparedFor)}
            </p>
          </div>

          {str(f.author) && (
            <div style={{ position: "absolute", right: 84, bottom: 72 }}>
              <Pill tone={t} size={TYPE.kickerSm}>
                {str(f.author)}
              </Pill>
            </div>
          )}

          {img && (
            <div style={{ position: "absolute", right: 84, top: 96, width: imgW, height: 507 }}>
              <ImageBox src={img} radius={18} tone={t} />
            </div>
          )}
        </div>
      </Stage>
    );
  },
};
