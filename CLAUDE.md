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
