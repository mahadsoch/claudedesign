import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, Portrait, tone, TYPE, titleTracking } from "./_shared/primitives";

// The team roster. Cells are portrait-proportioned (headshots crop badly in a
// landscape box), the role is set at kicker size rather than 15px, and a person
// with no photo gets an initials monogram — so the slide never ships as a grid
// of dashed "Photo" placeholders.
export const teamGrid: TemplateDef = {
  id: "team-grid",
  name: "Team grid",
  description: "A roster of people as headshot cards with names and roles.",
  tags: ["team", "people", "roster", "who", "faces", "headshots", "staff"],
  background: "cream",
  fields: [
    { key: "kicker", type: "text", label: "Kicker", maxLength: 40, placeholder: "07 · OUR TEAM" },
    { key: "title", type: "textarea", label: "Title", maxLength: 60, hint: "Wrap accent in [[…]]" },
    { key: "intro", type: "textarea", label: "Intro", maxLength: 120 },
    {
      key: "people",
      type: "list",
      label: "People",
      itemLabel: "Person",
      maxItems: 8,
      itemFields: [
        { key: "photo", type: "image", label: "Photo" },
        { key: "name", type: "text", label: "Name", maxLength: 28 },
        { key: "role", type: "text", label: "Role", maxLength: 26 },
      ],
    },
  ],
  defaults: () => ({
    kicker: "07 · OUR TEAM",
    title: "The people behind Soch",
    intro: "The senior operators, engineers and product leaders behind Soch.",
    people: [
      { photo: "", name: "Umair Shahzad", role: "COO" },
      { photo: "", name: "Mahad Imran", role: "DELIVERY OPS LEAD" },
      { photo: "", name: "Bilal Aftab", role: "TECH LEAD" },
      { photo: "", name: "Hijab Waheed", role: "IMPLEMENTATION LEAD" },
    ],
  }),
  render: (f, ctx) => {
    const t = tone(ctx.background);
    const people = rows(f.people);
    const n = Math.max(people.length, 1);
    const cols = n <= 4 ? Math.min(n, 4) : 4;
    // Two people should not become two 800px-wide photo slabs.
    const maxW = cols * 340 + (cols - 1) * 28;
    return (
      <Stage
        background={ctx.background}
        style={{ padding: "80px var(--pad-x)", display: "flex", flexDirection: "column" }}
      >
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} size={TYPE.h3 - 4} tone={t} />
        {str(f.intro) && (
          <p style={{ fontSize: TYPE.bodySm + 2, color: t.body, margin: "18px 0 0" }}>{str(f.intro)}</p>
        )}
        <div
          style={{
            marginTop: "var(--s5)",
            flex: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridAutoRows: "1fr",
            gap: 28,
            minHeight: 0,
            maxWidth: n < 4 ? maxW : "none",
          }}
        >
          {people.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              {/* 4:5 keeps the frame portrait, which is how faces sit. */}
              <div style={{ flex: 1, minHeight: 0, aspectRatio: "4 / 5" }}>
                <Portrait
                  src={ctx.resolveImage(str(p.photo))}
                  name={str(p.name)}
                  tone={t}
                  radius="var(--r-chip)"
                />
              </div>
              <div
                style={{
                  fontFamily: "var(--font-title)",
                  fontWeight: 600,
                  fontSize: TYPE.bodySm + 4,
                  letterSpacing: titleTracking(TYPE.bodySm + 4),
                  marginTop: 16,
                  color: t.title,
                }}
              >
                {p.name}
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: TYPE.kickerSm,
                  letterSpacing: 2,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: t.accent,
                  marginTop: 6,
                }}
              >
                {p.role}
              </div>
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
