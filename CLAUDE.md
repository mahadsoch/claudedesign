# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A local, single-user web app ("Brand Deck Builder") for creating on-brand slide
decks, editing them, and exporting a pixel-perfect PDF. The Soch brand is the
fixed standard, encoded in `DESIGN.md` + `styles/tokens.css`. Everything runs on
the user's machine — no accounts, no cloud. Decks live in the browser (IndexedDB).

Next.js 15 (App Router) + React 19 + TypeScript (strict). Zustand for state.

## Commands

```bash
npm run dev     # dev server at http://localhost:3000
npm run build   # production build
npm run start   # serve the production build
npm run lint    # next lint
```

There is **no test framework** in this repo — don't invent one. Verify changes by
running `npm run lint`, `npm run build`, and exercising the editor manually.

Path alias: `@/*` → repo root (e.g. `@/lib/model/deck`).

## The one invariant everything hangs on

Every slide is a fixed **1920 × 1080** stage. The *same React components* render
the on-screen editor preview and the printed PDF, so the PDF matches the editor
exactly. `STAGE_W`/`STAGE_H` (`lib/model/deck.ts`) and the `Stage` primitive
(`components/templates/_shared/primitives.tsx`) enforce this. Don't introduce
layout that depends on the viewport — everything is absolute against the 1920×1080
stage.

## Architecture

### Templates are the core abstraction

Each archetype is one self-describing module in `components/templates/` exporting a
`TemplateDef` (see `components/templates/types.ts`): a `fields` schema, a `render`
fn, `defaults`, `tags`/`description` (used by search + AI selection), and an
optional `expand` (see freeform below). **Adding a template = create the file +
add one import and one line to `components/templates/registry.ts`. Nothing else
changes** — the editor UI, gallery, and AI catalog all derive from the registry
and each `TemplateDef`.

- The **Inspector** (`components/editor/Inspector.tsx`) is a single generic form
  that walks a template's `fields` and renders the right input per `FieldType`
  (`text`/`textarea`/`image`/`list`). A new template gets its editor for free.
- Brand guardrails are **declarative**: `maxLength`/`maxItems` on `FieldDef`, and
  `validateDeck` coerces any input (AI output or imported JSON) to the schema —
  unknown templates/fields dropped, caps enforced, gaps filled from `defaults`.
  Brand safety by construction.
- Titles use **accent syntax**: wrap the single coral word in `[[double brackets]]`
  (rendered by `AccentTitle` in `_shared/primitives.tsx`).

### Data model (`lib/model/deck.ts`)

`Deck` → `slides[]`. A `Slide` is `{ template, background, fields }`. Once
"detached to canvas" it also carries an `elements[]` list of absolutely-positioned
`SlideElement`s (freeform overrides). Templates and the freeform renderer both
ultimately emit absolute DOM on the stage.

### State (`lib/state/deckStore.ts`)

A single Zustand store. **Every deck mutation flows through the `commit()`
wrapper**, which gives undo/redo history + debounced IndexedDB autosave for free —
so add new mutations via `withDeck(...)`, not by calling `set` on `deck`
directly. Rapid edits (typing) pass a `coalesceKey` so consecutive same-key
changes collapse into one undo step. `past`/`future` stacks live outside `deck`
so they never autosave.

### Freeform canvas ("detach")

`detachSlide` calls the template's `expand()` to materialize its fields into
`SlideElement`s; from then on `SlideRenderer` renders from `elements` via
`components/canvas/FreeformSlide.tsx` instead of the template. `reattachSlide`
discards the overrides. Only templates that define `expand` can be detached (the
Inspector gates the button on it). Uses `react-moveable` + `react-selecto`.

### AI generation (`app/api/generate/route.ts`)

Content-driven, **two-phase**:
1. **Plan** (Opus, `claude-opus-4-8`) — turns the brief into `{ intent, contentType }`
   beats. Does *not* write copy.
2. **Choose templates server-side** — `lib/ai/selectTemplate.ts` deterministically
   maps each content-type beat to a concrete template id (shortlist → keyword
   rank against intent → variety nudge). Template choice is grounded in code, not
   left to the model.
3. **Fill** (Sonnet, `claude-sonnet-5`) — writes the fields for the fixed templates.

Falls back to a single-pass generation if planning fails. Output always goes
through `validateDeck`. `DESIGN.md` is read at request time and injected as the
brand contract — it is the source of truth for the generator; keep it and
`styles/tokens.css` in sync when brand rules change.

**Provider** (`resolveProvider`): `ANTHROPIC_API_KEY` → billed API; otherwise the
local `claude` CLI (`lib/ai/claudeCode.ts`) running on the user's subscription.
`DECK_AI_PROVIDER=api|claude-code` forces one. `claudeCode.ts` deliberately
strips `ANTHROPIC_API_KEY`/`ANTHROPIC_AUTH_TOKEN` from the child env so the CLI
uses subscription auth, and passes the (user-controlled) brief over stdin.

### PDF export (`app/api/pdf` + `app/print`)

`/api/pdf` stores the deck in an in-memory `jobStore` keyed by a token, launches
headless Chromium (Playwright), loads `/print?token=…` (which fetches the deck
from `/api/pdf-data`), waits for the `[data-print-ready]` marker (fonts + layout
settled), and captures each slide as one 1920×1080 page with `printBackground`.
Before sending, the client inlines images as data URLs. Chromium path resolves
via `lib/pdf/browser.ts` (`PLAYWRIGHT_CHROMIUM_PATH` → `/opt/pw-browsers/chromium`
→ bundled). Playwright is kept out of the client bundle via
`serverExternalPackages` in `next.config.mjs`; PDF/generate routes are `runtime: "nodejs"`.

### PPTX export (`app/api/pptx` + `lib/pptx`)

Produces a deck of **native, editable PowerPoint objects** that matches the PDF.

**The rule: measure the layout, never re-implement it.** The route reuses the PDF
rig (same `jobStore`, `browser.ts`, `/print` page, `[data-print-ready]` marker),
but instead of printing it runs `extractDeckIR` (`lib/pptx/domExtract.ts`) *inside*
the page via `page.evaluate`, reading final geometry from the browser's own layout
engine — `getBoundingClientRect`, `getComputedStyle`, `Range.getClientRects`. That
flat, absolutely-positioned IR (`lib/pptx/types.ts`) becomes PPTX shapes in
`buildPptx.ts`.

Consequences worth preserving:
- All 25 templates **and** the freeform canvas export from one code path. A new
  template needs *zero* PPTX code — it still costs one file + one registry line.
- The PPTX cannot drift from the editor, because it comes from the same React
  render. Do **not** add a per-template PPTX emitter; the 5 `expand()` functions
  have already drifted from their own `render()` (e.g. `contact-cta` render gives
  `letterSpacing: -4` via `AccentTitle`'s `size > 90` branch, its `expand` says
  `-3`), which is exactly the failure mode to avoid.
- `getComputedStyle` returns *used* values, so `var(--coral)` arrives as
  `rgb(241,89,68)`. No CSS-variable table is needed, and hard-coded off-token
  hexes are handled by the same path.

Details that matter:
- **Units are exact**: 1920px ÷ 13.333in = 144 px/in, so `inches = px/144`,
  `pt = px/2`, `1px = 6350 EMU`. Every `TYPE_SCALE` size and letter-spacing lands
  on a clean 0.5pt boundary.
- **Hybrid wrapping**: single-line text flows naturally; text Chromium wrapped is
  emitted one paragraph per measured line with `wrap: false`, so PowerPoint can
  never re-wrap it differently.
- **Text position anchors to the measured baseline**, not the box edge, because
  PowerPoint places the first line differently from CSS under exact line spacing.
  If exported type ever sits uniformly high/low, `BASELINE_LINES` /
  `BASELINE_NUDGE_PX` in `buildPptx.ts` are the single knobs.
- **Fonts**: PPTX has no numeric weights, so `fonts.ts` maps weight → the face's
  own legacy family name (`Poppins SemiBold`) and `embedFonts.ts` writes the TTFs
  from `public/fonts/` into the zip. Mac PowerPoint / Google Slides ignore embedded
  fonts — for those, `GET /api/fonts` zips the same `EMBED_FACES` files plus an
  `INSTALL.txt` so the recipient can install them ("Fonts" button in the topbar).
- `domExtract.ts` is serialised by `page.evaluate`, so it **must stay
  self-contained** — no imports, no module-scope references, no syntax that makes
  the compiler hoist a helper out of the function body.
- `POST /api/pptx` takes `{ debug: true }` (return the IR as JSON — use this first
  when a slide looks wrong) and `{ flatten: true }` (screenshot each slide; perfect
  but non-editable).

### Images (`lib/persistence/imageStore.ts`)

An image field value is one of: `blob:<key>` (uploaded blob in IndexedDB, resolved
to an object URL / inlined for PDF), `icon:<name>` (bundled icon, `lib/icons/iconSet.tsx`),
or a plain `http(s)`/`data:`/`/public` path (used as-is). Uploads are downscaled
before storage. `RenderCtx.resolveImage` abstracts this so templates stay agnostic.

### Persistence

`lib/persistence/db.ts` (IndexedDB: decks + image blobs, via `idb`) and
`transfer.ts` (export/import a deck as one self-contained JSON with images inlined).

## Brand rules (from `DESIGN.md`)

When authoring templates or editing brand output: palette is ink / cream / coral
only (tokens in `styles/tokens.css`); one coral accent per title; mono uppercase
kicker; Poppins titles / Open Sans body / JetBrains Mono kickers; no gradients,
shadows, or off-palette colours. Background rhythm: dark = anchor moments, coral =
emotional beats (quotes/principles), cream = workhorse content. `DESIGN.md` is the
full contract — read it before changing anything brand-facing.
