# Brand Deck Builder

A local web app to create on-brand decks at scale, edit them, and export a
pixel-perfect PDF. The Soch "AI-Native Teams" deck is encoded as the fixed brand
standard (see `DESIGN.md`).

Built with Next.js (App Router) + TypeScript. Runs entirely on your machine —
no accounts, no cloud. Decks are saved in your browser (IndexedDB).

## What's possible

- **13 on-brand templates** — title/hero, agenda (2×2), pull quote, big stats,
  content list w/ figures, logo stack grid, statement, 2×2 matrix, quadrant
  highlight, two-column compare, results/numbers, operating principle, and
  contact/CTA. Add / reorder / duplicate / delete slides from the slide rail.
- **Text & image editing** — a field inspector generated from each template's
  schema, with brand guardrails baked in; upload & swap images (auto-downscaled,
  stored locally in IndexedDB).
- **Accent syntax** — wrap the coral highlight in a title with
  `[[double brackets]]`, e.g. `How to build [[AI-native]] teams.`
- **Generate with AI** — describe a deck in plain English and Claude drafts a
  full set of on-brand slides (picking templates + filling fields) that you
  then tweak by hand. Requires `ANTHROPIC_API_KEY` (see Setup).
- **Freeform canvas** — "detach" any slide to move, resize, restyle, or add
  text/shape/image elements beyond the template's fixed fields, with layering,
  duplication, and a one-click "reset to template" to discard the overrides.
- **Undo / redo** — full history across edits (⌘Z / ⇧⌘Z).
- **One-click PDF** — true pixel-perfect export via headless Chrome (each slide
  is one page at 1920×1080, backgrounds and fonts preserved exactly as in the
  editor).
- **Backup** — export / import a deck as a single self-contained JSON file
  (images inlined as data URIs).

## Setup

Requires Node.js 18.18+ (Next.js 15) and npm.

```bash
git clone <this-repo>
cd claudedesign
npm install
npm run dev
# open http://localhost:3000
```

That's it for the editor, templates, and PDF export — everything runs locally
against IndexedDB, no accounts or external services required.

### Enable "Generate with AI" (optional)

1. Copy the env example: `cp .env.local.example .env.local`
2. Get a key at https://console.anthropic.com/ and set `ANTHROPIC_API_KEY` in
   `.env.local`. The key stays server-side (used only by `app/api/generate/route.ts`)
   and is never shipped to the browser.
3. Restart `npm run dev`, then use the **✦ Generate with AI** button in the
   editor toolbar.

### PDF export

The PDF route (`app/api/pdf`) uses Playwright + headless Chromium. If Chromium
isn't found, set `PLAYWRIGHT_CHROMIUM_PATH` in `.env.local` to your Chromium
binary (the app also checks `/opt/pw-browsers/chromium` by default).

## How it's built

- `components/templates/` — one self-describing module per archetype
  (`TemplateDef`: field schema + render fn + defaults). `registry.ts` lists them;
  adding a template is a one-file change.
- `components/editor/` — the editor shell; `Inspector` is a single generic form
  driven by each template's field schema; `GenerateModal` drives the AI flow.
- `components/canvas/` — the freeform canvas (detach/move/resize elements,
  toolbar, element rendering) layered on top of a slide's template render.
- `lib/model/deck.ts` — the deck/slide/element data model.
- `lib/state/deckStore.ts` — Zustand store with debounced IndexedDB autosave
  and undo/redo history.
- `lib/persistence/` — IndexedDB (decks + image blobs), JSON transfer.
- `lib/ai/` — the template catalog fed to Claude and validation of its output
  against the schema before it's accepted into the deck.
- `app/api/generate/` — the AI drafting endpoint (`ANTHROPIC_API_KEY` required).
- `app/api/pdf/` + `app/print/` — the deck is rendered by the same components at
  1920×1080 and captured by Playwright, so the PDF matches the editor exactly.
- `styles/tokens.css` + `DESIGN.md` — the single source of brand truth.
