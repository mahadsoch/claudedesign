# Brand Deck Builder

A local web app to create on-brand decks at scale, edit them, and export a
pixel-perfect PDF. The Soch "AI-Native Teams" deck is encoded as the fixed brand
standard (see `DESIGN.md`).

Built with Next.js (App Router) + TypeScript. Runs entirely on your machine —
no accounts, no cloud. Decks are saved in your browser (IndexedDB).

## What's possible

- **25 on-brand templates** — from title/hero, cover card, agenda and pull
  quote through the full proposal set (context + stat rail, three-column
  problem, phased process, feature grid, impact + highlight, "you are here"
  roadmap, pricing tiers, team grid, featured bio, next-steps timeline) to the
  contact/CTA. Add / reorder / duplicate / delete slides from the slide rail.
- **Template library** — a "＋ Add slide from template" / "▦ Templates" gallery
  with a live preview and a "when to use" note per template, plus a one-click
  **Executive Review** starter deck that lays down the full proposal narrative.
  Search by what the slide is about (pricing, roadmap, team…) to surface the
  best-fit template first.
- **Text & image editing** — a field inspector generated from each template's
  schema, with brand guardrails baked in; upload & swap images (auto-downscaled,
  stored locally in IndexedDB).
- **Accent syntax** — wrap the coral highlight in a title with
  `[[double brackets]]`, e.g. `How to build [[AI-native]] teams.`
- **Generate with AI** — describe a deck in plain English and Claude drafts a
  full set of on-brand slides that you then tweak by hand. Template choice is
  content-driven: Claude first plans each slide's intent + content type, the
  server maps that to the best-fit template (content-type taxonomy + keyword
  ranker + variety rules), then a second pass fills the fields. Authenticate
  with an `ANTHROPIC_API_KEY` **or** your Claude Code subscription login (see
  Setup).
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

Pick **either** credential — the app auto-selects based on what's available:

**Option A — API key (billed usage)**

1. Copy the env example: `cp .env.local.example .env.local`
2. Get a key at https://console.anthropic.com/ and set `ANTHROPIC_API_KEY` in
   `.env.local`. The key stays server-side (used only by `app/api/generate/route.ts`)
   and is never shipped to the browser.
3. Restart `npm run dev`, then use the **✦ Generate with AI** button in the
   editor toolbar.

**Option B — Claude Code (your Pro/Max subscription)**

1. Leave `ANTHROPIC_API_KEY` unset, install the `claude` CLI, and log in with
   `claude login`.
2. Generation shells out to `claude` locally and runs through your subscription
   instead of billed API usage — your credentials never reach the browser.

By default the app uses the API key if one is set, otherwise Claude Code. Force
one explicitly with `DECK_AI_PROVIDER=api` or `DECK_AI_PROVIDER=claude-code` in
`.env.local`.

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
- `app/api/generate/` — the AI drafting endpoint; authenticates via
  `ANTHROPIC_API_KEY` or, failing that, the local `claude` CLI (`lib/ai/claudeCode.ts`).
- `app/api/pdf/` + `app/print/` — the deck is rendered by the same components at
  1920×1080 and captured by Playwright, so the PDF matches the editor exactly.
- `styles/tokens.css` + `DESIGN.md` — the single source of brand truth.
