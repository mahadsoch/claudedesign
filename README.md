# Brand Deck Builder

A local web app to create on-brand decks at scale, edit them, and export a
pixel-perfect PDF. The Soch "AI-Native Teams" deck is encoded as the fixed brand
standard (see `DESIGN.md`).

Built with Next.js (App Router) + TypeScript. Runs entirely on your machine —
no accounts, no cloud. Decks are saved in your browser (IndexedDB).

## What works today (Phase 1)

- **Editor** — three-pane UI: slide rail, live 1920×1080 preview, field inspector.
- **25 on-brand templates** — from title/hero, agenda and pull-quote through the
  full proposal set (context + stat rail, three-column problem, phased process,
  feature grid, impact + highlight, roadmap, pricing tiers, team grid, featured
  bio, next-steps timeline) to the contact CTA. Add / reorder / duplicate /
  delete slides.
- **Template library** — a "＋ Add slide from template" / "▦ Templates" gallery
  with a live preview and a "when to use" note per template, plus a one-click
  **Executive Review** starter deck. Search by what the slide is about (pricing,
  roadmap, team…) to surface the best-fit template first.
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

- **Phase 2** — AI first-draft generation (`/api/generate`, set
  `ANTHROPIC_API_KEY` in `.env.local`). Two-pass: the model first plans each
  slide's intent + content type, the server maps that to the best-fit template
  (content-type taxonomy + keyword ranker + variety rules), then a second pass
  fills the fields — so template choice is grounded in content. Undo/redo.
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
