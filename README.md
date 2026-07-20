# Brand Deck Builder

A local web app to create on-brand decks at scale, edit them, and export a
pixel-perfect PDF. The Soch "AI-Native Teams" deck is encoded as the fixed brand
standard (see `DESIGN.md`).

Built with Next.js (App Router) + TypeScript. Runs entirely on your machine —
no accounts, no cloud. Decks are saved in your browser (IndexedDB).

## What works today (Phase 1)

- **Editor** — three-pane UI: slide rail, live 1920×1080 preview, field inspector.
- **5 on-brand templates** — Title/Hero, Content figures list, Big stats, Pull
  quote, Contact/CTA. Add / reorder / duplicate / delete slides.
- **Text & image editing** — labelled fields with brand guardrails; upload &
  swap images (auto-downscaled, stored locally).
- **One-click PDF** — true pixel-perfect export via headless Chrome (each slide
  is one page at 1920×1080, backgrounds and fonts preserved).
- **Backup** — export / import a deck as self-contained JSON (images inlined).

Accent syntax: wrap the coral highlight in a title with `[[double brackets]]`,
e.g. `How to build [[AI-native]] teams.`

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

The PDF route uses Playwright + Chromium. If Chromium isn't found, set
`PLAYWRIGHT_CHROMIUM_PATH` to your Chromium binary (the app also checks
`/opt/pw-browsers/chromium`).

## Roadmap

- **Phase 2** — remaining 8 templates; AI first-draft generation
  (`/api/generate`, set `ANTHROPIC_API_KEY` in `.env.local`); undo/redo.
- **Phase 3** — freeform canvas (move/resize/add any element).

## How it's built

- `components/templates/` — one self-describing module per archetype
  (`TemplateDef`: field schema + render fn + defaults). `registry.ts` lists them;
  adding a template is a one-file change.
- `components/editor/` — the editor shell; `Inspector` is a single generic form
  driven by each template's field schema.
- `lib/model/deck.ts` — the deck/slide/element data model.
- `lib/state/deckStore.ts` — Zustand store with debounced IndexedDB autosave.
- `lib/persistence/` — IndexedDB (decks + image blobs), JSON transfer.
- `app/api/pdf/` + `app/print/` — the deck is rendered by the same components at
  1920×1080 and captured by Playwright, so the PDF matches the editor exactly.
- `styles/tokens.css` + `DESIGN.md` — the single source of brand truth.
