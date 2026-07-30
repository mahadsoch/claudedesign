import PptxGenJS from "pptxgenjs";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { ImageMark, Mark, ShapeMark, SlideIR, TextMark } from "./types";
import { pptxFont, THEME_BODY, THEME_HEAD } from "./fonts";

// ── unit conversion ────────────────────────────────────────────────────────
// The 1920×1080 stage maps onto a 16:9 slide at exactly 144 px/in, so both
// conversions are lossless: every size in TYPE_SCALE and every letter-spacing
// in the deck lands on a clean 0.5pt boundary.
const PX_PER_IN = 144;
const inch = (px: number) => px / PX_PER_IN;
const pt = (px: number) => px / 2;
/** Round to a sane precision so the XML stays readable and diffable. */
const r4 = (n: number) => Math.round(n * 10000) / 10000;
const r2 = (n: number) => Math.round(n * 100) / 100;

const SLIDE_W_IN = STAGE_W / PX_PER_IN;
const SLIDE_H_IN = STAGE_H / PX_PER_IN;

/**
 * Vertical text placement — deliberately self-correcting.
 *
 * PowerPoint and CSS disagree about where the first baseline sits inside an
 * exact line box, and that rule is not something we can pin down from here. So
 * we avoid depending on it: each text box is made *exactly* as tall as its text
 * (n lines × the measured line-height) and anchored `middle`.
 *
 * Under "Exactly" line spacing the text block is also n × line-height tall, so
 * there is no slack for PowerPoint's first-line rule to act on — the block fills
 * the box and every line lands on its CSS line box. If PowerPoint's block height
 * is slightly different after all, centring splits the error in half and keeps it
 * symmetric instead of letting it accumulate downward.
 *
 * If exported type still sits uniformly high or low against the PDF, nudge it
 * here — this is the only vertical knob in the exporter.
 */
const BASELINE_NUDGE_PX = 0;

const NO_SHADOW = { type: "none" as const };

/** Shape fills carry real transparency; PPTX wants percent, not alpha. */
function fillOf(f?: { color: string; alpha: number }) {
  if (!f || f.alpha <= 0.004) return undefined;
  const transparency = f.alpha >= 0.999 ? undefined : Math.round((1 - f.alpha) * 100);
  return transparency === undefined ? { color: f.color } : { color: f.color, transparency };
}

function lineOf(l?: { color: string; alpha: number; w: number; dash?: "dash" }) {
  if (!l || l.w <= 0 || l.alpha <= 0.004) return undefined;
  const out: Record<string, unknown> = { color: l.color, width: r2(pt(l.w)) };
  if (l.alpha < 0.999) out.transparency = Math.round((1 - l.alpha) * 100);
  if (l.dash) out.dashType = l.dash;
  return out;
}

function addShape(slide: PptxGenJS.Slide, m: ShapeMark) {
  const fill = fillOf(m.fill);
  const line = lineOf(m.line);
  if (!fill && !line) return;

  const wIn = inch(m.w);
  const hIn = inch(m.h);
  const opts: Record<string, unknown> = {
    x: r4(inch(m.x)),
    y: r4(inch(m.y)),
    w: r4(wIn),
    h: r4(hIn),
    shadow: NO_SHADOW,
  };
  if (fill) opts.fill = fill;
  else opts.fill = { type: "none" };
  if (line) opts.line = line;
  if (m.rot) opts.rotate = r2(m.rot);

  let shape: "rect" | "roundRect" | "ellipse" = "rect";
  if (m.ellipse) {
    shape = "ellipse";
  } else if (m.radius && m.radius > 0.5) {
    shape = "roundRect";
    // pptxgenjs takes rectRadius in inches and emits adj = radius / min(w,h),
    // so half the shorter side is a full stadium/pill.
    opts.rectRadius = r4(Math.min(inch(m.radius), Math.min(wIn, hIn) / 2));
  }
  slide.addShape(shape, opts as PptxGenJS.ShapeProps);
}

function addImage(slide: PptxGenJS.Slide, m: ImageMark) {
  const opts: PptxGenJS.ImageProps = {
    data: m.data,
    x: r4(inch(m.x)),
    y: r4(inch(m.y)),
    w: r4(inch(m.w)),
    h: r4(inch(m.h)),
  };
  if (m.rot) opts.rotate = r2(m.rot);
  slide.addImage(opts);
}

function addText(slide: PptxGenJS.Slide, m: TextMark) {
  const items: PptxGenJS.TextProps[] = [];
  for (let p = 0; p < m.paras.length; p++) {
    const runs = m.paras[p];
    const lastPara = p === m.paras.length - 1;
    if (runs.runs.length === 0) {
      // Preserve a genuinely blank line.
      items.push({ text: "", options: { breakLine: !lastPara } });
      continue;
    }
    for (let i = 0; i < runs.runs.length; i++) {
      const run = runs.runs[i];
      const font = pptxFont(run.family, run.weight);
      const opts: PptxGenJS.TextPropsOptions = {
        fontFace: font.typeface,
        fontSize: r2(pt(run.sizePx)),
        color: run.color,
        bold: font.bold,
      };
      if (run.letterSpacingPx) opts.charSpacing = r2(pt(run.letterSpacingPx));
      if (run.italic) opts.italic = true;
      if (run.underline) opts.underline = { style: "sng" };
      // A break at the end of a paragraph's last run starts the next paragraph.
      if (i === runs.runs.length - 1 && !lastPara) opts.breakLine = true;
      items.push({ text: run.text, options: opts });
    }
  }
  if (items.length === 0) return;

  // The box is the measured CSS line-box block, exactly: top of the first line,
  // n lines tall. Combined with `valign: middle` that removes any dependence on
  // PowerPoint's first-line rule (see BASELINE_NUDGE_PX).
  const lines = m.paras.length;
  const topPx = m.vertical ? m.y : m.firstLineTopPx + BASELINE_NUDGE_PX;
  const heightPx = m.vertical ? m.h : m.lineHeightPx * lines;

  const opts: PptxGenJS.TextPropsOptions = {
    x: r4(inch(m.x)),
    y: r4(inch(topPx)),
    w: r4(inch(m.w)),
    h: r4(inch(heightPx)),
    align: m.align,
    valign: "middle",
    margin: 0,
    // Hybrid wrapping: pinned text already carries Chromium's line breaks, so
    // PowerPoint must not re-wrap it. Single-line text stays free-flowing.
    wrap: !m.pinned,
    fit: "none",
    lineSpacing: r2(pt(m.lineHeightPx)),
    isTextBox: true,
    shadow: NO_SHADOW,
    bullet: false,
  };
  if (m.vertical) {
    // vertical-rl + rotate(180deg) reads bottom-to-top — PPTX calls that vert270.
    opts.vert = "vert270";
  } else if (m.rot) {
    opts.rotate = r2(m.rot);
  }
  slide.addText(items, opts);
}

/** Background token → master name, so recipients get real PowerPoint layouts. */
const MASTERS: Record<string, string> = {
  "141414": "SOCH_DARK",
  FCF5EB: "SOCH_CREAM",
  F15944: "SOCH_CORAL",
};

export interface BuildOptions {
  title?: string;
  author?: string;
}

/** Turn extracted slide IR into a .pptx buffer of native PowerPoint objects. */
export async function buildPptx(slides: SlideIR[], opts: BuildOptions = {}): Promise<Buffer> {
  const pptx = new PptxGenJS();

  pptx.defineLayout({ name: "STAGE", width: SLIDE_W_IN, height: SLIDE_H_IN });
  pptx.layout = "STAGE";
  pptx.theme = { headFontFace: THEME_HEAD, bodyFontFace: THEME_BODY };
  pptx.title = opts.title || "Deck";
  if (opts.author) pptx.author = opts.author;

  // One master per brand background. They hold no objects — every mark is
  // placed on the slide itself — but they give PowerPoint sane defaults and put
  // the brand backgrounds one click away.
  pptx.defineSlideMaster({ title: "SOCH_DARK", background: { color: "141414" } });
  pptx.defineSlideMaster({ title: "SOCH_CREAM", background: { color: "FCF5EB" } });
  pptx.defineSlideMaster({ title: "SOCH_CORAL", background: { color: "F15944" } });

  for (const ir of slides) {
    const masterName = MASTERS[ir.fill.toUpperCase()];
    const slide = masterName ? pptx.addSlide({ masterName }) : pptx.addSlide();
    slide.background = { color: ir.fill };

    for (const mark of ir.marks as Mark[]) {
      if (mark.kind === "shape") addShape(slide, mark);
      else if (mark.kind === "image") addImage(slide, mark);
      else addText(slide, mark);
    }
  }

  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
}

/** Build a non-editable deck from full-slide screenshots (the escape hatch). */
export async function buildPptxFromImages(images: string[], opts: BuildOptions = {}): Promise<Buffer> {
  const pptx = new PptxGenJS();
  pptx.defineLayout({ name: "STAGE", width: SLIDE_W_IN, height: SLIDE_H_IN });
  pptx.layout = "STAGE";
  pptx.title = opts.title || "Deck";
  if (opts.author) pptx.author = opts.author;

  for (const data of images) {
    const slide = pptx.addSlide();
    slide.addImage({ data, x: 0, y: 0, w: SLIDE_W_IN, h: SLIDE_H_IN });
  }
  const out = await pptx.write({ outputType: "nodebuffer" });
  return out as Buffer;
}
