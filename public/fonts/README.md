# Bundled TrueType faces (PPTX export only)

These ten `.ttf` files exist for one reason: **PPTX font embedding needs
TrueType**, and `next/font` only emits `.woff2`. The app itself does not load
them — the browser still gets its fonts from `next/font/google` (see
`app/layout.tsx`). Two things read this directory: `lib/pptx/embedFonts.ts`, which
writes the faces into an exported `.pptx` so recipients see the brand type without
installing anything, and `app/api/fonts/route.ts`, which zips them for download
(the escape hatch for Mac PowerPoint and Google Slides, which ignore embedded
fonts).

## Why these exact ten

PPTX has no numeric font weights — an embedded typeface has only regular / bold
slots — so each weight the deck uses is shipped under its own legacy family name
(`Poppins SemiBold`, etc.). `lib/pptx/fonts.ts` owns that mapping and is the only
place to change it. Verified against each file's name table:

| file | family (name ID 1) | subfamily | weight | fsType |
| --- | --- | --- | --- | --- |
| `Poppins-Regular.ttf` | Poppins | Regular | 400 | 0 |
| `Poppins-Medium.ttf` | Poppins Medium | Regular | 500 | 0 |
| `Poppins-SemiBold.ttf` | Poppins SemiBold | Regular | 600 | 0 |
| `Poppins-Bold.ttf` | Poppins | Bold | 700 | 0 |
| `OpenSans-Regular.ttf` | Open Sans | Regular | 400 | 0 |
| `OpenSans-SemiBold.ttf` | Open Sans SemiBold | Regular | 600 | 0 |
| `OpenSans-Bold.ttf` | Open Sans | Bold | 700 | 0 |
| `JetBrainsMono-Regular.ttf` | JetBrains Mono | Regular | 400 | 0 |
| `JetBrainsMono-Medium.ttf` | JetBrains Mono Medium | Regular | 500 | 0 |
| `JetBrainsMono-Bold.ttf` | JetBrains Mono | Bold | 700 | 0 |

`fsType: 0` means *installable embedding* — no licence restriction on embedding
them in a document. Poppins and JetBrains Mono are OFL-1.1; Open Sans is OFL-1.1
(originally Apache-2.0).

## Provenance

Poppins comes from the `google/fonts` repo, which still ships static instances:

```
https://raw.githubusercontent.com/google/fonts/main/ofl/poppins/Poppins-<Weight>.ttf
```

`google/fonts` now carries **only variable** builds of Open Sans
(`OpenSans[wdth,wght].ttf`) and JetBrains Mono (`JetBrainsMono[wght].ttf`), and
variable fonts are unreliable when embedded in a `.pptx`. Those two come from the
Fontsource CDN's static latin instances instead:

```
https://cdn.jsdelivr.net/fontsource/fonts/open-sans@latest/latin-<weight>-normal.ttf
https://cdn.jsdelivr.net/fontsource/fonts/jetbrains-mono@latest/latin-<weight>-normal.ttf
```

Note Fontsource subsets are **disjoint** — `latin-ext` contains only the extended
range, not ASCII, so `latin` is the one to fetch. The latin subset covers the
letters, digits, punctuation, curly quotes, em-dashes and accented characters the
decks use.

## Known gap

No face here (nor full Poppins from Google) contains `↑` U+2191 or `→` U+2192,
the two arrows in the `matrix-2x2` axis labels. Chromium already falls back to a
system font for them when rendering the editor and the PDF, and PowerPoint does
the same, so behaviour matches — but those two glyphs are not brand-controlled.
