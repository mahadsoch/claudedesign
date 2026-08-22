# Soch — Brand Design Contract

This is the brand standard every generated deck must honour. It is the source
of truth for the AI generator (`/api/generate` reads it) and the human reference
for building new templates. Extracted verbatim from the reference deck
*"How to Build AI-Native Teams · Soch"*, then extended with the structural
vocabulary the template library needs.

## Voice
Practical, direct, confident. Short declarative sentences. No hype. The accent is
used sparingly for emphasis — one accented phrase per title, not a rainbow.

## Palette

| Token            | Hex       | Use                                             |
| ---------------- | --------- | ----------------------------------------------- |
| `--ink`          | `#141414` | Dark slide backgrounds; text on light           |
| `--cream`        | `#FCF5EB` | Light slide backgrounds; text on dark           |
| `--coral`        | `#F15944` | THE accent — kickers, one word per title, CTAs  |
| `--coral-hover`  | `#C7452F` | Link/button hover                               |
| `--stone`        | `#ECECD4` | Muted light surface                             |
| `--warm-gray`    | `#8A8578` | Muted labels / sources                          |
| `--body-dark`    | `#B9B3A4` | Body copy on dark                               |
| `--body-light`   | `#6B6558` | Body copy on light                              |
| `--card-fill`    | `#FFFFFF` | Card backgrounds on cream slides                |
| `--card-border`  | `#D9D2C0` | Card borders on cream slides                    |

### Surface ramps
Layering *within* a background, so a dark slide can hold a raised panel and a
cream slide a recessed band without leaving the palette. No new hues.

`--ink-raised` `--ink-sunken` `--border-dark-2` · `--cream-sunken` `--cream-panel`
· `--coral-wash` `--coral-chip` `--on-coral-panel` `--on-coral-rule`

Never hard-code a hex in a template. Ask `tone(background)` for the right token.

## Type

- **Titles** — Poppins 600, 42–130px, line-height ~1.05. Letter-spacing comes from
  `titleTracking(size)`, never from a literal.
- **Body** — Open Sans 400/600, 22–36px, line-height 1.4–1.5.
- **Kickers / labels / list numbers** — JetBrains Mono 500/700, UPPERCASE,
  letter-spacing 2–5px.
- **Hero stats** — Poppins 600, up to ~250px, the `%`/unit ~half size.
- Sizes come from the `TYPE` scale in `_shared/primitives.tsx`. Every size is even,
  so `pt = px/2` lands on a clean 0.5pt boundary in PowerPoint.

Index numerals are mono; hero metrics are Poppins. `Numeral` and `Stat` respectively.

## Layout rules

- Every slide is a fixed **1920 × 1080** stage. One page frame: `--pad-y` 90px
  vertical, `--pad-x` 130px horizontal. Spacing comes off the 8px `--s*` scale.
- Recurring rhythm: **kicker → Poppins title (with ONE accent span) → body.**
- Buttons: accent fill, `border-radius: 999px`, padding 22px/52px, Poppins 600.
- Cards: `border-radius` 20–24px, uniform on all four corners.
- Rules: four weights only — `--rule-hair` `--rule-1` `--rule-2` `--rule-heavy`.

## Background rhythm

The background belongs to the **slide**, not the template — a template only
supplies a default. Every template renders correctly on all three.

- **Dark** (`--ink`): the opener, big-impact moments, the close — anchors.
- **Coral** (`--coral`): pull-quotes and operating principles only — the
  emotional beats. On coral the accent inverts to `--ink`.
- **Cream** (`--cream`): the workhorse content slides.

**Never more than two cream slides in a row**, and never two adjacent slides on
the same heavy background unless it is deliberate.

## Composition

- Vary the entry point. If every slide opens with a kicker at the same corner,
  the deck has no rhythm — some slides should bleed, invert, or lead with a
  numeral or a figure instead.
- Scale contrast should be real: roughly 4–6× between the largest and smallest
  type on a slide, not 2×.
- Depth comes from colour blocking, hairline rules and flat panels.
- One element per anchor slide may break the page margin or overlap another.

## Export constraints (why the rules above are the rules)

The PPTX exporter measures the real DOM, so **what it cannot read is silently
dropped**. Templates are built to a flat-design engine:

- ✅ solid fills (including alpha), uniform borders, `dashed`, single-side borders
  as hairline rules, uniform `border-radius`, circles (square boxes only),
  rotation, `<img>`, inline `<svg>`, text runs, `writing-mode: vertical-rl`.
- ❌ gradients (a gradient stage exports as a **white** slide), `background-image`,
  box/text shadow, filters, blend modes, `clip-path`, `::before`/`::after` (so
  native `<ul>` bullets vanish), per-corner radii, text clipped by
  `overflow: hidden`, `<canvas>` charts, `transform: scale()`.
- ⚠️ An inline `<span>` that *paints* anything (a highlight, a chip, a border)
  inside a text block splits that block into overlapping marks. Accent spans may
  carry colour and nothing else; put highlights behind the text as their own
  positioned block.
- ⚠️ SVG rasterises with `currentColor` pinned — so SVG carries geometry only,
  never text, and never a `var(--…)` fill.

Charts are built from divs where possible (they export as native, editable
PowerPoint shapes) and from SVG only where the geometry is genuinely curved.

## Do / Don't

- ✅ One accent per title. ✅ Mono kicker on almost every slide. ✅ Big confident type.
- ✅ Ask `tone()` for colours. ✅ Use `Rule`, `Numeral`, `Stat`, `Card`, `Panel`, `Pill`.
- ❌ No gradients, drop shadows, or off-palette colours. ❌ No hard-coded hexes.
- ❌ No more than 2 type sizes competing in a block.
- ❌ No template that only works on one background.
