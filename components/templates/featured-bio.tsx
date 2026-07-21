import type { TemplateDef } from "./types";
import { str } from "./types";
import { Stage, Kicker, ImageBox } from "./_shared/primitives";

// A single featured person: a portrait on the left, and a name, role, bio and
// a "previous experience" note on the right. The lead-architect spotlight.
export const featuredBio: TemplateDef = {
  id: "featured-bio",
  name: "Featured bio",
  description: "Spotlight one person: portrait, name, role, a short bio and prior experience.",
  tags: ["bio", "profile", "founder", "lead", "person", "spotlight", "about"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "06 · OUR TEAM" },
    { key: "image", type: "image", label: "Portrait" },
    { key: "name", type: "text", label: "Name", maxLength: 30 },
    { key: "role", type: "text", label: "Role", maxLength: 30 },
    { key: "bio", type: "textarea", label: "Bio", maxLength: 320 },
    { key: "experienceLabel", type: "text", label: "Experience label", maxLength: 30 },
    { key: "experience", type: "textarea", label: "Experience", maxLength: 160 },
  ],
  defaults: () => ({
    kicker: "06 · OUR TEAM",
    image: "",
    name: "Rizwan Mahmood",
    role: "Lead Architect",
    bio: "Riz has worked across SaaS, retail, manufacturing, and professional services — which means the automation is built around how your business actually runs, not a generic template.",
    experienceLabel: "PREVIOUS EXPERIENCE",
    experience: "Ex-founder and operator. Ships production automation on n8n and the Claude API.",
  }),
  render: (f, ctx) => (
    <Stage background="cream" style={{ padding: "90px 130px", display: "flex", flexDirection: "column" }}>
      <Kicker style={{ marginBottom: 44 }}>{str(f.kicker)}</Kicker>
      <div style={{ flex: 1, display: "flex", gap: 80, minHeight: 0, alignItems: "stretch" }}>
        <div style={{ flex: "0 0 480px", minHeight: 0 }}>
          <ImageBox src={ctx.resolveImage(str(f.image))} radius={22} placeholder="Portrait" />
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <h2 style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 68, letterSpacing: -2, margin: 0 }}>{str(f.name)}</h2>
          <div style={{ fontFamily: "var(--font-title)", fontWeight: 500, fontSize: 34, color: "var(--coral)", marginTop: 8 }}>{str(f.role)}</div>
          <p style={{ fontSize: 28, lineHeight: 1.55, color: "var(--body-light)", margin: "34px 0 0", maxWidth: 900 }}>{str(f.bio)}</p>
          {str(f.experience) && (
            <div style={{ marginTop: 44, borderTop: "1px solid var(--card-border)", paddingTop: 28 }}>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 18, letterSpacing: 3, fontWeight: 600, color: "var(--warm-gray)" }}>
                {str(f.experienceLabel)}
              </div>
              <p style={{ fontSize: 24, lineHeight: 1.5, color: "var(--body-light)", margin: "14px 0 0", maxWidth: 860 }}>{str(f.experience)}</p>
            </div>
          )}
        </div>
      </div>
    </Stage>
  ),
};
