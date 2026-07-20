# Soch — Brand Design Contract

This is the brand standard every generated deck must honour. It is the source
of truth for the AI generator (`/api/generate` reads it) and the human reference
for building new templates. Extracted verbatim from the reference deck
*"How to Build AI-Native Teams · Soch"*.

## Voice
Practical, direct, confident. Short declarative sentences. No hype. Coral is used
sparingly for emphasis — one accented phrase per title, not a rainbow.

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

## Type

- **Titles** — Poppins 600, 42–130px, letter-spacing −1 to −4px, line-height ~1.05.
- **Body** — Open Sans 400/600, 24–36px, line-height 1.4–1.5.
- **Kickers / labels / numbers** — JetBrains Mono 500/700, UPPERCASE, letter-spacing 3–5px.
- **Hero stats** — Poppins 600, ~190px, letter-spacing −6px, the `%`/unit ~half size.

## Layout rules

- Every slide is a fixed **1920 × 1080** stage. Standard padding ≈ 90–100px vertical, 120px horizontal.
- Recurring rhythm: **coral kicker → Poppins title (with ONE coral accent span) → Open Sans body.**
- Buttons: coral fill, cream text, `border-radius: 999px`, padding ~22px/52px, Poppins 600.
- Cards: `border-radius: 20–24px`.

## Background rhythm

- **Dark** (`--ink`): title, big-stats, systems, contact — anchor/impact moments.
- **Coral** (`--coral`): pull-quotes and operating principles only — the emotional beats.
- **Cream** (`--cream`): the workhorse content slides.

Alternate so no two adjacent slides share a heavy background unless intentional.

## Do / Don't

- ✅ One coral accent per title. ✅ Mono kicker on almost every slide. ✅ Big confident type.
- ❌ No gradients, drop shadows, or off-palette colours. ❌ No more than 2 type sizes competing in a block.
