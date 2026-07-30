// The PPTX intermediate representation.
//
// A deck is exported by *measuring* the real rendered DOM (see domExtract.ts),
// never by re-implementing template layout. The result is this IR: one flat,
// paint-ordered list of absolutely-positioned marks per slide, in stage pixels
// on the fixed 1920×1080 stage, with every colour already resolved to a solid
// hex.
//
// buildPptx.ts turns the IR into native PowerPoint objects. Because 1920px maps
// to exactly 13.333in (144 px/in), the conversion is lossless:
//   inches = px / 144      points = px / 2

/** Solid 6-digit hex, no leading "#" — the form pptxgenjs wants. */
export type Hex = string;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
  /**
   * Degrees clockwise about the box centre. Only present when a `transform`
   * rotation is in play — a freeform canvas element the user rotated, or the
   * vertical axis label in matrix-2x2.
   */
  rot?: number;
}

export interface Fill {
  color: Hex;
  /** 0 = invisible, 1 = opaque. Shape fills map this to PPTX `transparency`. */
  alpha: number;
}

export interface Line {
  color: Hex;
  alpha: number;
  /** Border width in px. */
  w: number;
  dash?: "dash";
}

export interface ShapeMark extends Box {
  kind: "shape";
  fill?: Fill;
  line?: Line;
  /** Corner radius in px. Clamped to min(w,h)/2 when emitted. */
  radius?: number;
  /** A circle — the radius covered the whole box and it was square-ish. */
  ellipse?: boolean;
}

export interface ImageMark extends Box {
  kind: "image";
  /** data: URL. Already cropped to the box and corner-rounded if needed. */
  data: string;
}

export interface Run {
  text: string;
  /** Canonical family: "Poppins" | "Open Sans" | "JetBrains Mono". */
  family: string;
  /** 400 | 500 | 600 | 700 — mapped to a PPTX typeface + bold flag by fonts.ts. */
  weight: number;
  sizePx: number;
  /** Already composited over the backdrop, so it needs no alpha channel. */
  color: Hex;
  letterSpacingPx: number;
  italic?: boolean;
  underline?: boolean;
}

export interface Para {
  runs: Run[];
}

export interface TextMark extends Box {
  kind: "text";
  /** When `pinned`, exactly one paragraph per line Chromium actually laid out. */
  paras: Para[];
  /**
   * Hybrid wrapping: text that fitted on one line flows naturally in PowerPoint
   * (nicest to edit); text that wrapped keeps Chromium's exact breaks so the
   * layout can never reflow.
   */
  pinned: boolean;
  align: "left" | "center" | "right";
  /** Used line-height in px — becomes exact PPTX line spacing in points. */
  lineHeightPx: number;
  /**
   * Top of the first CSS line box, stage-absolute. This is the anchor the
   * builder positions against — together with a box exactly n×lineHeight tall
   * and `valign: middle`, it pins the type without relying on PowerPoint's
   * first-line rule. See `BASELINE_NUDGE_PX` in buildPptx.ts.
   */
  firstLineTopPx: number;
  /**
   * Measured baseline of the first line, stage-absolute. Not used for placement;
   * kept because it is the ground truth to check against when type looks off.
   */
  firstBaselinePx: number;
  /** Font metrics of the first run, for the builder's baseline model. */
  ascentPx: number;
  descentPx: number;
  /** Vertical writing mode (the matrix-2x2 Y-axis label) — PPTX vert270. */
  vertical?: boolean;
}

export type Mark = ShapeMark | ImageMark | TextMark;

export interface SlideIR {
  w: number;
  h: number;
  /** Slide background, always opaque (the Stage sets ink/cream/coral). */
  fill: Hex;
  marks: Mark[];
}

/** What `page.evaluate(extractDeckIR)` resolves to. */
export interface ExtractResult {
  slides: SlideIR[];
  /** Non-fatal problems worth surfacing in the server log. */
  warnings: string[];
}
