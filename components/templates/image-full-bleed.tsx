import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, ImageBox, Rule, parseAccents, tone, TYPE, titleTracking } from "./_shared/primitives";

// A photograph filling the whole stage, with the type held in a scrim panel.
// Nothing else in the library touches the stage edge, so this is the deck's
// widest gesture — use it once, for a moment that earns it.
//
// The scrim is a SOLID low-alpha panel, never a gradient: a gradient is not
// read by the exporter, so a gradient scrim would export as unreadable type on
// a bare photo.
export const imageFullBleed: TemplateDef = {
  id: "image-full-bleed",
  name: "Image · full bleed",
  description: "A full-bleed photograph with a title held in a scrim — a visual pause or a section open.",
  tags: ["image", "photo", "full bleed", "cover", "visual", "section", "hero", "pause"],
  background: "dark",
  fields: [
    { key: "image", type: "image", label: "Background image" },
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40 },
    { key: "title", type: "textarea", label: "Title", maxLength: 70, hint: "Wrap accent in [[…]]" },
    { key: "caption", type: "textarea", label: "Caption", maxLength: 140 },
    {
      key: "position",
      type: "select",
      label: "Scrim position",
      options: [
        { value: "left", label: "Left panel" },
        { value: "bottom", label: "Bottom band" },
      ],
    },
  ],
  defaults: () => ({
    image: "",
    kicker: "HOW WE WORK",
    title: "Built on your stack, [[owned by your team]]",
    caption: "Nothing leaves your tenant. Nothing depends on us being in the room.",
    position: "left",
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const left = str(f.position, "left") === "left";
    // Solid, near-opaque scrim — the exporter reads a colour with alpha, but
    // never a gradient.
    const scrim = ctx.background === "cream" ? "rgba(252,245,235,0.94)" : "rgba(20,20,20,0.90)";
    return (
      <Stage background={ctx.background} padded={false}>
        <div style={{ position: "absolute", inset: 0 }}>
          <ImageBox
            src={ctx.resolveImage(str(f.image))}
            radius={0}
            placeholder="Drop a full-bleed image"
            tone={t}
          />
        </div>

        <div
          style={
            left
              ? {
                  position: "absolute",
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: 880,
                  background: scrim,
                  padding: "var(--pad-y) var(--pad-x)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  boxSizing: "border-box",
                }
              : {
                  position: "absolute",
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: scrim,
                  padding: "72px var(--pad-x)",
                  display: "flex",
                  flexDirection: "column",
                  boxSizing: "border-box",
                }
          }
        >
          <Kicker>{str(f.kicker)}</Kicker>
          <h1
            style={{
              fontFamily: "var(--font-title)",
              fontWeight: 600,
              fontSize: left ? TYPE.h2 : TYPE.h3,
              lineHeight: 1.05,
              letterSpacing: titleTracking(left ? TYPE.h2 : TYPE.h3),
              margin: "28px 0 0",
              color: t.title,
              maxWidth: left ? "none" : 1300,
            }}
          >
            {parseAccents(str(f.title))}
          </h1>
          {str(f.caption) && (
            <>
              <Rule tone={t} weight="2" color={t.accent} length={96} style={{ margin: "36px 0 28px" }} />
              <p
                style={{
                  fontSize: TYPE.h6 - 2,
                  lineHeight: 1.5,
                  color: t.body,
                  margin: 0,
                  maxWidth: left ? "none" : 1000,
                }}
              >
                {str(f.caption)}
              </p>
            </>
          )}
        </div>
      </Stage>
    );
  },
};
