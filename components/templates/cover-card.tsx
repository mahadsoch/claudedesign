import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, ImageBox, Logo, parseAccents } from "./_shared/primitives";

// Cover with a dark inset card floating on cream — the "Executive Review"
// opener from the proposal decks: Soch logo, big title, a "prepared for" line,
// an author pill, and an optional portrait on the right.
export const coverCard: TemplateDef = {
  id: "cover-card",
  name: "Cover · dark card",
  description: "A proposal cover: dark card on cream with a title, 'prepared for' line and author.",
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
    const img = ctx.resolveImage(str(f.image));
    return (
      <Stage background="cream" style={{ padding: 72 }}>
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "100%",
            background: "var(--ink)",
            color: "var(--cream)",
            borderRadius: 28,
            padding: "72px 84px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Logo height={44} />

          <div style={{ marginTop: "auto", maxWidth: img ? 1150 : "100%" }}>
            <div style={{ height: 1, background: "rgba(252,245,235,0.18)", marginBottom: 54 }} />
            <h1
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: 92,
                letterSpacing: -3,
                lineHeight: 1.04,
                margin: 0,
              }}
            >
              {parseAccents(str(f.title))}
            </h1>
            <p style={{ fontSize: 30, color: "var(--body-dark)", margin: "34px 0 0" }}>{str(f.preparedFor)}</p>
          </div>

          {str(f.author) && (
            <div
              style={{
                position: "absolute",
                right: 84,
                bottom: 72,
                background: "var(--coral)",
                color: "var(--cream)",
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: 24,
                borderRadius: 999,
                padding: "16px 34px",
              }}
            >
              {str(f.author)}
            </div>
          )}

          {img && (
            <div style={{ position: "absolute", right: 84, top: 96, width: 300, height: 620 }}>
              <ImageBox src={img} radius={18} />
            </div>
          )}
        </div>
      </Stage>
    );
  },
};
