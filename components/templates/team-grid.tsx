import type { TemplateDef } from "./types";
import { str, rows } from "./types";
import { Stage, SectionHead, ImageBox } from "./_shared/primitives";

// The team roster: a grid of headshot cards, each a photo, a name and a coral
// mono role. Handles up to eight people, wrapping to four per row.
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
      { photo: "", name: "Ahmad Tehseen", role: "AUTOMATION ENGINEER" },
      { photo: "", name: "Husnain Shafqat", role: "OPS ANALYST" },
      { photo: "", name: "Muniba Javed", role: "OPS ASSOCIATE" },
      { photo: "", name: "Abeeha Aslam", role: "CONTENT STRATEGIST" },
    ],
  }),
  render: (f, ctx) => {
    const people = rows(f.people);
    const cols = people.length <= 4 ? people.length || 1 : 4;
    return (
      <Stage background="cream" style={{ padding: "80px 130px", display: "flex", flexDirection: "column" }}>
        <SectionHead kicker={str(f.kicker)} title={str(f.title)} size={56} />
        {str(f.intro) && <p style={{ fontSize: 24, color: "var(--body-light)", margin: "18px 0 0" }}>{str(f.intro)}</p>}
        <div
          style={{
            marginTop: 40,
            flex: 1,
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, 1fr)`,
            gridAutoRows: "1fr",
            gap: 28,
            minHeight: 0,
          }}
        >
          {people.map((p, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", minHeight: 0 }}>
              <div style={{ flex: 1, minHeight: 0 }}>
                <ImageBox src={ctx.resolveImage(str(p.photo))} radius={18} placeholder="Photo" />
              </div>
              <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 24, letterSpacing: -0.5, marginTop: 14 }}>{p.name}</div>
              <div style={{ fontFamily: "var(--font-mono)", fontSize: 15, letterSpacing: 2, fontWeight: 600, color: "var(--coral)", marginTop: 5 }}>{p.role}</div>
            </div>
          ))}
        </div>
      </Stage>
    );
  },
};
