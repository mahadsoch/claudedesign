import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, Kicker, Portrait, Rule, Stat, tone, TYPE, titleTracking } from "./_shared/primitives";

// A single featured person: a full-height portrait on the left, and a name,
// role, bio and credential row on the right. The credentials fill what used to
// be a ragged void under the bio.
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
    {
      key: "credentials",
      type: "list",
      label: "Credentials",
      itemLabel: "Credential",
      maxItems: 3,
      itemFields: [
        { key: "value", type: "text", label: "Figure", maxLength: 8, placeholder: "12" },
        { key: "label", type: "text", label: "Label", maxLength: 30 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "06 · OUR TEAM",
    image: "",
    name: "Rizwan Mahmood",
    role: "Lead Architect",
    bio: "Riz has worked across SaaS, retail, manufacturing, and professional services — which means the automation is built around how your business actually runs, not a generic template.",
    experienceLabel: "PREVIOUS EXPERIENCE",
    experience: "Ex-founder and operator. Ships production automation on n8n and the Claude API.",
    credentials: [
      { value: "12", label: "years operating" },
      { value: "40+", label: "automations shipped" },
      { value: "4", label: "industries" },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const creds = rows(f.credentials);
    return (
      <Stage background={ctx.background} style={{ display: "flex", flexDirection: "column" }}>
        <Kicker style={{ marginBottom: 44 }}>{str(f.kicker)}</Kicker>
        <div style={{ flex: 1, display: "flex", gap: 80, minHeight: 0, alignItems: "stretch" }}>
          <div style={{ flex: "0 0 460px", minHeight: 0 }}>
            <Portrait src={ctx.resolveImage(str(f.image))} name={str(f.name)} tone={t} radius="var(--r-card)" />
          </div>
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <h2
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 600,
                fontSize: TYPE.h2 - 4,
                letterSpacing: titleTracking(TYPE.h2 - 4),
                margin: 0,
                color: t.title,
              }}
            >
              {str(f.name)}
            </h2>
            <div
              style={{
                fontFamily: "var(--font-title)",
                fontWeight: 500,
                fontSize: TYPE.h5 - 2,
                color: t.accent,
                marginTop: 8,
              }}
            >
              {str(f.role)}
            </div>
            <p style={{ fontSize: TYPE.h6 - 2, lineHeight: 1.55, color: t.body, margin: "34px 0 0" }}>
              {str(f.bio)}
            </p>

            {creds.length > 0 && (
              <div style={{ display: "flex", gap: 64, marginTop: "var(--s6)" }}>
                {creds.map((c, i) => (
                  <div key={i}>
                    <Stat value={str(c.value)} size={TYPE.h3} color={t.accent} />
                    <div
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: TYPE.kickerSm - 2,
                        letterSpacing: 2,
                        textTransform: "uppercase",
                        color: t.muted,
                        marginTop: 10,
                      }}
                    >
                      {c.label}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {str(f.experience) && (
              <div style={{ marginTop: "var(--s5)" }}>
                <Rule tone={t} style={{ marginBottom: 28 }} />
                <div
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: TYPE.kickerSm,
                    letterSpacing: 3,
                    fontWeight: 600,
                    color: t.muted,
                  }}
                >
                  {str(f.experienceLabel)}
                </div>
                <p style={{ fontSize: TYPE.bodySm + 2, lineHeight: 1.5, color: t.body, margin: "14px 0 0" }}>
                  {str(f.experience)}
                </p>
              </div>
            )}
          </div>
        </div>
      </Stage>
    );
  },
};
