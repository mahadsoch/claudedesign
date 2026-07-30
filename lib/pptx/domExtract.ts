import type { ExtractResult } from "./types";

/**
 * Measures the rendered `/print` page and returns the PPTX IR.
 *
 * ⚠️ This function is handed to `page.evaluate(extractDeckIR)`, which serialises
 * it with `Function.prototype.toString()` and re-parses it inside the browser.
 * That means it must be **completely self-contained**:
 *
 *   - no imports, and no references to anything in module scope
 *   - no helper-emitting syntax that the compiler might hoist out of the
 *     function body (avoid object/array spread, `for…of` over non-arrays,
 *     generators, decorators)
 *   - types are fine — they are erased before serialisation
 *
 * Anything it needs must be declared inside it, even if that duplicates a
 * constant that exists elsewhere in the repo.
 *
 * Why measure instead of re-implementing template layout: only 5 of 25
 * templates expose absolute coordinates via `expand()`; the rest are flexbox
 * and grid. Reading the browser's own layout means all 25 templates plus the
 * freeform canvas export from one code path, and the PPTX can never drift from
 * what the editor and the PDF show.
 */
export async function extractDeckIR(): Promise<ExtractResult> {
  // ── types (local mirrors of ./types) ──────────────────────────────────────
  type Hex = string;
  interface Rect { x: number; y: number; w: number; h: number }
  interface RGBA { r: number; g: number; b: number; a: number }
  interface Fill { color: Hex; alpha: number }
  interface Line { color: Hex; alpha: number; w: number; dash?: "dash" }
  interface Run {
    text: string; family: string; weight: number; sizePx: number;
    color: Hex; letterSpacingPx: number; italic?: boolean; underline?: boolean;
  }
  interface Mark {
    kind: "shape" | "image" | "text";
    x: number; y: number; w: number; h: number; rot?: number;
    fill?: Fill; line?: Line; radius?: number; ellipse?: boolean;
    data?: string;
    paras?: { runs: Run[] }[];
    pinned?: boolean; align?: "left" | "center" | "right";
    lineHeightPx?: number; firstLineTopPx?: number; firstBaselinePx?: number;
    ascentPx?: number; descentPx?: number; vertical?: boolean;
  }
  /** Inherited state threaded down the DOM walk. */
  interface Ctx {
    /** Nearest fully-opaque background beneath this node — used to flatten text alpha. */
    backdrop: RGBA;
    /** Product of every ancestor `opacity`. */
    opacity: number;
    /** Nearest rounded `overflow:hidden` clip, for pre-rounding images. */
    round: { rect: Rect; radius: number } | null;
  }

  const warnings: string[] = [];
  const warn = (m: string) => { if (warnings.indexOf(m) === -1) warnings.push(m); };

  // ── colour ───────────────────────────────────────────────────────────────
  // getComputedStyle returns *used* values, so `var(--coral)` already arrives
  // as `rgb(241, 89, 68)`. No CSS-variable table is needed anywhere.
  function parseColor(v: string): RGBA {
    if (!v || v === "transparent" || v === "none") return { r: 0, g: 0, b: 0, a: 0 };
    const m = v.match(/rgba?\(([^)]+)\)/);
    if (!m) return { r: 0, g: 0, b: 0, a: 0 };
    const p = m[1].split(/[,\s/]+/).filter((s) => s.length > 0).map(parseFloat);
    return { r: p[0] || 0, g: p[1] || 0, b: p[2] || 0, a: p.length > 3 ? p[3] : 1 };
  }
  function toHex(c: RGBA): Hex {
    const h = (n: number) => {
      const v = Math.max(0, Math.min(255, Math.round(n))).toString(16);
      return v.length === 1 ? "0" + v : v;
    };
    return (h(c.r) + h(c.g) + h(c.b)).toUpperCase();
  }
  /** Flatten a translucent colour onto its backdrop — PPTX text has no alpha. */
  function composite(fg: RGBA, alpha: number, bg: RGBA): Hex {
    const a = Math.max(0, Math.min(1, alpha));
    if (a >= 0.999) return toHex(fg);
    return toHex({
      r: fg.r * a + bg.r * (1 - a),
      g: fg.g * a + bg.g * (1 - a),
      b: fg.b * a + bg.b * (1 - a),
      a: 1,
    });
  }

  const num = (v: string) => {
    const n = parseFloat(v);
    return isFinite(n) ? n : 0;
  };

  /** Map a resolved font stack back to the three brand families. */
  function canonFamily(stack: string): string {
    const s = stack.toLowerCase();
    if (s.indexOf("poppins") !== -1) return "Poppins";
    if (s.indexOf("open sans") !== -1 || s.indexOf("open_sans") !== -1) return "Open Sans";
    if (s.indexOf("jetbrains") !== -1) return "JetBrains Mono";
    const first = stack.split(",")[0].replace(/["']/g, "").trim();
    if (first) warn("Unmapped font family: " + first);
    return first || "Open Sans";
  }

  // Font metrics, cached per CSS font shorthand.
  const metricCanvas = document.createElement("canvas");
  const metricCtx = metricCanvas.getContext("2d");
  const metricCache: Record<string, { ascent: number; descent: number }> = {};
  function metrics(cs: CSSStyleDeclaration): { ascent: number; descent: number } {
    const key = cs.fontStyle + " " + cs.fontWeight + " " + cs.fontSize + " " + cs.fontFamily;
    const hit = metricCache[key];
    if (hit) return hit;
    let out = { ascent: num(cs.fontSize) * 0.8, descent: num(cs.fontSize) * 0.2 };
    if (metricCtx) {
      metricCtx.font = key;
      const m = metricCtx.measureText("Hxjgp");
      if (m.fontBoundingBoxAscent || m.fontBoundingBoxDescent) {
        out = { ascent: m.fontBoundingBoxAscent, descent: m.fontBoundingBoxDescent };
      }
    }
    metricCache[key] = out;
    return out;
  }

  // ── geometry ─────────────────────────────────────────────────────────────
  let originX = 0;
  let originY = 0;
  const rectOf = (el: Element): Rect => {
    const r = el.getBoundingClientRect();
    return { x: r.left - originX, y: r.top - originY, w: r.width, h: r.height };
  };
  const round2 = (n: number) => Math.round(n * 100) / 100;

  /** Rotation baked into `transform` (freeform canvas elements can be rotated). */
  function rotationOf(cs: CSSStyleDeclaration): number {
    const t = cs.transform;
    if (!t || t === "none") return 0;
    const m = t.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const p = m[1].split(",").map(parseFloat);
    const deg = (Math.atan2(p[1], p[0]) * 180) / Math.PI;
    return Math.abs(deg) < 0.01 ? 0 : deg;
  }

  /**
   * A rotated element's bounding rect is the axis-aligned hull, which is not
   * the shape PPTX wants. Recover the unrotated box from its layout size.
   */
  function boxOf(el: HTMLElement, cs: CSSStyleDeclaration): Rect & { rot?: number } {
    const r = rectOf(el);
    const rot = rotationOf(cs);
    if (!rot) return r;
    const w = el.offsetWidth || r.w;
    const h = el.offsetHeight || r.h;
    return { x: r.x + r.w / 2 - w / 2, y: r.y + r.h / 2 - h / 2, w, h, rot };
  }

  function radiusOf(cs: CSSStyleDeclaration, box: Rect): number {
    const v = cs.borderTopLeftRadius;
    if (!v) return 0;
    if (v.indexOf("%") !== -1) return (num(v) / 100) * Math.min(box.w, box.h);
    return num(v);
  }

  // ── mark emission ────────────────────────────────────────────────────────
  let marks: Mark[] = [];
  const push = (m: Mark) => {
    if (m.w <= 0.2 || m.h <= 0.2) return;
    m.x = round2(m.x); m.y = round2(m.y); m.w = round2(m.w); m.h = round2(m.h);
    if (m.lineHeightPx !== undefined) m.lineHeightPx = round2(m.lineHeightPx);
    if (m.firstBaselinePx !== undefined) m.firstBaselinePx = round2(m.firstBaselinePx);
    if (m.firstLineTopPx !== undefined) m.firstLineTopPx = round2(m.firstLineTopPx);
    if (m.ascentPx !== undefined) m.ascentPx = round2(m.ascentPx);
    if (m.descentPx !== undefined) m.descentPx = round2(m.descentPx);
    marks.push(m);
  };

  /** True when the element paints a background, a border, or a rounded edge. */
  function hasChrome(cs: CSSStyleDeclaration, box: Rect): boolean {
    if (parseColor(cs.backgroundColor).a > 0.004) return true;
    if (num(cs.borderTopWidth) > 0 && cs.borderTopStyle !== "none") return true;
    if (num(cs.borderRightWidth) > 0 && cs.borderRightStyle !== "none") return true;
    if (num(cs.borderBottomWidth) > 0 && cs.borderBottomStyle !== "none") return true;
    if (num(cs.borderLeftWidth) > 0 && cs.borderLeftStyle !== "none") return true;
    if (radiusOf(cs, box) > 0 && parseColor(cs.backgroundColor).a > 0.004) return true;
    return false;
  }

  /**
   * Emit the box decoration of one element: its background and its borders.
   *
   * A uniform border becomes one shape outline (inset by half its width, since
   * CSS strokes inside the box while PPTX centres on it). Single-side borders —
   * the hairline rules all over this deck (`borderTop: 2px solid var(--ink)`,
   * `borderLeft: 2px solid var(--coral)`) — become thin filled rectangles
   * exactly where CSS paints them.
   */
  function emitChrome(el: HTMLElement, cs: CSSStyleDeclaration, ctx: Ctx) {
    const box = boxOf(el, cs);
    const bg = parseColor(cs.backgroundColor);
    const radius = radiusOf(cs, box);

    const sides = [
      { w: num(cs.borderTopWidth), c: cs.borderTopColor, s: cs.borderTopStyle },
      { w: num(cs.borderRightWidth), c: cs.borderRightColor, s: cs.borderRightStyle },
      { w: num(cs.borderBottomWidth), c: cs.borderBottomColor, s: cs.borderBottomStyle },
      { w: num(cs.borderLeftWidth), c: cs.borderLeftColor, s: cs.borderLeftStyle },
    ].map((s) => (s.s === "none" || s.s === "hidden" ? { w: 0, c: s.c, s: s.s } : s));

    const uniform =
      sides[0].w > 0 &&
      sides.every((s) => Math.abs(s.w - sides[0].w) < 0.01 && s.c === sides[0].c && s.s === sides[0].s);

    const bgAlpha = bg.a * ctx.opacity;
    const bgFill: Fill | undefined = bgAlpha > 0.004 ? { color: toHex(bg), alpha: bgAlpha } : undefined;

    if (uniform) {
      const bw = sides[0].w;
      const bc = parseColor(sides[0].c);
      const isEllipse = radius * 2 >= Math.min(box.w, box.h) - 1 && Math.abs(box.w - box.h) <= 1;
      push({
        kind: "shape",
        x: box.x + bw / 2, y: box.y + bw / 2, w: box.w - bw, h: box.h - bw, rot: box.rot,
        fill: bgFill,
        line: { color: toHex(bc), alpha: bc.a * ctx.opacity, w: bw, dash: sides[0].s === "dashed" ? "dash" : undefined },
        radius: Math.max(0, radius - bw / 2),
        ellipse: isEllipse || undefined,
      });
      return;
    }

    if (bgFill) {
      const isEllipse = radius * 2 >= Math.min(box.w, box.h) - 1 && Math.abs(box.w - box.h) <= 1;
      push({
        kind: "shape", x: box.x, y: box.y, w: box.w, h: box.h, rot: box.rot,
        fill: bgFill, radius: radius || undefined, ellipse: isEllipse || undefined,
      });
    }

    // Individual edges — the deck's hairline rules and dividers.
    const edge = (i: number, r: Rect) => {
      const s = sides[i];
      if (s.w <= 0) return;
      const c = parseColor(s.c);
      if (c.a * ctx.opacity <= 0.004) return;
      push({ kind: "shape", x: r.x, y: r.y, w: r.w, h: r.h, rot: box.rot, fill: { color: toHex(c), alpha: c.a * ctx.opacity } });
    };
    edge(0, { x: box.x, y: box.y, w: box.w, h: sides[0].w });
    edge(2, { x: box.x, y: box.y + box.h - sides[2].w, w: box.w, h: sides[2].w });
    edge(3, { x: box.x, y: box.y, w: sides[3].w, h: box.h });
    edge(1, { x: box.x + box.w - sides[1].w, y: box.y, w: sides[1].w, h: box.h });
  }

  // ── images ───────────────────────────────────────────────────────────────
  /**
   * Redraw an image into a canvas at 2×, applying the same object-fit crop the
   * browser used and pre-rounding the corners when an ancestor clips with a
   * radius (PowerPoint cannot round a picture, and `ImageBox` rounds every
   * photo in the deck).
   */
  function rasterImage(img: HTMLImageElement, box: Rect, cs: CSSStyleDeclaration, ctx: Ctx): string | null {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return null;

    const scale = 2;
    const cw = Math.max(1, Math.round(box.w * scale));
    const ch = Math.max(1, Math.round(box.h * scale));
    const cv = document.createElement("canvas");
    cv.width = cw;
    cv.height = ch;
    const c = cv.getContext("2d");
    if (!c) return null;

    // Corner rounding comes from the clipping ancestor (ImageBox), not the img.
    let radius = radiusOf(cs, box);
    if (ctx.round) {
      const cr = ctx.round.rect;
      if (box.x >= cr.x - 1 && box.y >= cr.y - 1 && box.x + box.w <= cr.x + cr.w + 1 && box.y + box.h <= cr.y + cr.h + 1) {
        radius = Math.max(radius, ctx.round.radius);
      }
    }
    radius = Math.min(radius, Math.min(box.w, box.h) / 2);

    if (radius > 0.5) {
      const r = radius * scale;
      c.beginPath();
      c.moveTo(r, 0);
      c.lineTo(cw - r, 0); c.quadraticCurveTo(cw, 0, cw, r);
      c.lineTo(cw, ch - r); c.quadraticCurveTo(cw, ch, cw - r, ch);
      c.lineTo(r, ch); c.quadraticCurveTo(0, ch, 0, ch - r);
      c.lineTo(0, r); c.quadraticCurveTo(0, 0, r, 0);
      c.closePath();
      c.clip();
    }

    const fit = cs.objectFit || "fill";
    if (fit === "cover" || fit === "contain") {
      const s = fit === "cover" ? Math.max(cw / nw, ch / nh) : Math.min(cw / nw, ch / nh);
      const dw = nw * s;
      const dh = nh * s;
      c.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    } else {
      c.drawImage(img, 0, 0, cw, ch);
    }

    // Rounded corners need alpha; everything else is smaller as a JPEG.
    try {
      return radius > 0.5 ? cv.toDataURL("image/png") : cv.toDataURL("image/jpeg", 0.92);
    } catch (e) {
      warn("Canvas export failed (tainted image?): " + (e as Error).message);
      return null;
    }
  }

  /** Rasterise an inline icon SVG, resolving `currentColor` first. */
  async function rasterSvg(svg: SVGElement, box: Rect, cs: CSSStyleDeclaration): Promise<string | null> {
    const clone = svg.cloneNode(true) as SVGElement;
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    clone.setAttribute("width", String(box.w));
    clone.setAttribute("height", String(box.h));
    // The icon set strokes with `currentColor`; pin it to the computed colour so
    // it survives the trip through a data URL.
    clone.setAttribute("style", "color:" + cs.color);
    const src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));

    const scale = 4;
    const img = new Image();
    img.src = src;
    try {
      await img.decode();
    } catch {
      warn("SVG rasterisation failed");
      return null;
    }
    const cv = document.createElement("canvas");
    cv.width = Math.max(1, Math.round(box.w * scale));
    cv.height = Math.max(1, Math.round(box.h * scale));
    const c = cv.getContext("2d");
    if (!c) return null;
    c.drawImage(img, 0, 0, cv.width, cv.height);
    return cv.toDataURL("image/png");
  }

  // ── text ─────────────────────────────────────────────────────────────────
  const range = document.createRange();

  function applyTransform(s: string, mode: string, atWordStart: boolean): string {
    if (mode === "uppercase") return s.toUpperCase();
    if (mode === "lowercase") return s.toLowerCase();
    if (mode === "capitalize") return atWordStart ? s.toUpperCase() : s;
    return s;
  }

  function styleOfRun(cs: CSSStyleDeclaration, ctx: Ctx): Run {
    const col = parseColor(cs.color);
    const ls = cs.letterSpacing === "normal" ? 0 : num(cs.letterSpacing);
    return {
      text: "",
      family: canonFamily(cs.fontFamily),
      weight: parseInt(cs.fontWeight, 10) || 400,
      sizePx: num(cs.fontSize),
      color: composite(col, col.a * ctx.opacity, ctx.backdrop),
      letterSpacingPx: ls,
      italic: cs.fontStyle === "italic" ? true : undefined,
      underline: cs.textDecorationLine.indexOf("underline") !== -1 ? true : undefined,
    };
  }
  const sameStyle = (a: Run, b: Run) =>
    a.family === b.family && a.weight === b.weight && a.sizePx === b.sizePx &&
    a.color === b.color && a.letterSpacingPx === b.letterSpacingPx &&
    a.italic === b.italic && a.underline === b.underline;

  /** Every text node under `el`, paired with the style that applies to it. */
  function textNodesOf(el: HTMLElement, directOnly: boolean): { node: Text; cs: CSSStyleDeclaration }[] {
    const out: { node: Text; cs: CSSStyleDeclaration }[] = [];
    const visit = (n: Node) => {
      for (let i = 0; i < n.childNodes.length; i++) {
        const child = n.childNodes[i];
        if (child.nodeType === 3) {
          const t = child as Text;
          if (t.data.length > 0) out.push({ node: t, cs: getComputedStyle(n as Element) });
        } else if (child.nodeType === 1 && !directOnly) {
          visit(child);
        }
      }
    };
    visit(el);
    return out;
  }

  /** Distinct vertical bands covered by a range's rects ⇒ how many lines. */
  function lineBands(rects: DOMRectList): number {
    const iv: { t: number; b: number }[] = [];
    for (let i = 0; i < rects.length; i++) {
      const r = rects[i];
      if (r.width === 0 && r.height === 0) continue;
      iv.push({ t: r.top, b: r.bottom });
    }
    if (iv.length === 0) return 0;
    iv.sort((a, b) => a.t - b.t);
    let bands = 1;
    let cur = iv[0].b;
    for (let i = 1; i < iv.length; i++) {
      // Mixed font sizes share a line, so overlapping bands are one line.
      if (iv[i].t >= cur - 0.5) { bands++; cur = iv[i].b; }
      else if (iv[i].b > cur) cur = iv[i].b;
    }
    return bands;
  }

  interface LineAcc { runs: Run[]; left: number; right: number; top: number }

  function emitText(el: HTMLElement, cs: CSSStyleDeclaration, ctx: Ctx, directOnly: boolean) {
    const nodes = textNodesOf(el, directOnly);
    if (nodes.length === 0) return;
    let all = "";
    for (let i = 0; i < nodes.length; i++) all += nodes[i].node.data;
    if (!all.trim()) return;

    const box = boxOf(el, cs);
    const vertical = cs.writingMode !== "horizontal-tb" && cs.writingMode !== "";

    // Content box: text is laid out inside padding + border, and aligning to it
    // is what makes padded pills and flex-centred labels land correctly.
    const inset = {
      l: num(cs.paddingLeft) + num(cs.borderLeftWidth),
      r: num(cs.paddingRight) + num(cs.borderRightWidth),
      t: num(cs.paddingTop) + num(cs.borderTopWidth),
    };
    const contentL = box.x + inset.l;
    const contentR = box.x + box.w - inset.r;

    const first = styleOfRun(nodes[0].cs, ctx);
    const fm = metrics(nodes[0].cs);

    // Vertical text (the matrix-2x2 axis label): one run, no line splitting —
    // the horizontal line-break heuristics below do not apply.
    if (vertical) {
      const runs: Run[] = [];
      for (let i = 0; i < nodes.length; i++) {
        const r = styleOfRun(nodes[i].cs, ctx);
        const tt = nodes[i].cs.textTransform;
        r.text = applyTransform(nodes[i].node.data, tt, true).replace(/\s+/g, " ");
        if (r.text) runs.push(r);
      }
      if (runs.length === 0) return;
      const vLh = cs.lineHeight.indexOf("px") !== -1 ? num(cs.lineHeight) : fm.ascent + fm.descent;
      push({
        kind: "text", x: box.x, y: box.y, w: box.w, h: box.h, rot: box.rot,
        paras: [{ runs }], pinned: false, align: "center", vertical: true,
        lineHeightPx: vLh, firstLineTopPx: box.y, firstBaselinePx: box.y + vLh,
        ascentPx: fm.ascent, descentPx: fm.descent,
      });
      return;
    }

    range.selectNodeContents(el);
    const bands = lineBands(range.getClientRects());
    const lines: LineAcc[] = [];
    const newLine = () => { lines.push({ runs: [], left: Infinity, right: -Infinity, top: Infinity }); };
    newLine();

    const addChar = (proto: Run, ch: string) => {
      const line = lines[lines.length - 1];
      const last = line.runs[line.runs.length - 1];
      if (last && sameStyle(last, proto)) last.text += ch;
      else {
        const r: Run = {
          text: ch, family: proto.family, weight: proto.weight, sizePx: proto.sizePx,
          color: proto.color, letterSpacingPx: proto.letterSpacingPx,
          italic: proto.italic, underline: proto.underline,
        };
        line.runs.push(r);
      }
    };

    if (bands <= 1) {
      // Fast path: one line, so no per-character measuring is needed at all.
      // (Most marks in the deck — kickers, titles, stats, labels.)
      const line = lines[0];
      for (let i = 0; i < nodes.length; i++) {
        const proto = styleOfRun(nodes[i].cs, ctx);
        const tt = nodes[i].cs.textTransform;
        const raw = nodes[i].node.data;
        let out = "";
        for (let j = 0; j < raw.length; j++) {
          const prev = j > 0 ? raw[j - 1] : " ";
          out += applyTransform(raw[j], tt, /\s/.test(prev));
        }
        out = out.replace(/[\r\n\t]+/g, " ");
        if (out) addChar(proto, out);
      }
      const rects = range.getClientRects();
      for (let i = 0; i < rects.length; i++) {
        const r = rects[i];
        if (r.width === 0 && r.height === 0) continue;
        line.left = Math.min(line.left, r.left - originX);
        line.right = Math.max(line.right, r.right - originX);
        line.top = Math.min(line.top, r.top - originY);
      }
    } else {
      // Wrapped text: walk characters and detect the carriage return, which for
      // LTR text is the moment x jumps backwards. Each measured line becomes its
      // own paragraph so PowerPoint cannot re-wrap it differently.
      let prevLeft: number | null = null;
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i].node;
        const nodeCs = nodes[i].cs;
        const proto = styleOfRun(nodeCs, ctx);
        const tt = nodeCs.textTransform;
        const pre = nodeCs.whiteSpace.indexOf("pre") !== -1;
        const raw = node.data;
        for (let j = 0; j < raw.length; j++) {
          const ch = raw[j];
          if (ch === "\n") {
            if (pre) { newLine(); prevLeft = null; }
            continue;
          }
          if (ch === "\r" || ch === "\t") continue;
          range.setStart(node, j);
          range.setEnd(node, j + 1);
          const r = range.getBoundingClientRect();
          const out = applyTransform(ch, tt, j > 0 ? /\s/.test(raw[j - 1]) : true);
          if (r.width === 0 && r.height === 0) {
            // Collapsed whitespace at a line edge — keep it, ignore for layout.
            if (lines[lines.length - 1].runs.length > 0) addChar(proto, out);
            continue;
          }
          if (prevLeft !== null && r.left < prevLeft - 1) { newLine(); }
          prevLeft = r.left;
          const line = lines[lines.length - 1];
          line.left = Math.min(line.left, r.left - originX);
          line.right = Math.max(line.right, r.right - originX);
          line.top = Math.min(line.top, r.top - originY);
          addChar(proto, out);
        }
      }
    }

    // Trim each line's edges: trailing spaces would shift centred text.
    for (let i = 0; i < lines.length; i++) {
      const runs = lines[i].runs;
      if (runs.length) {
        runs[0].text = runs[0].text.replace(/^\s+/, "");
        runs[runs.length - 1].text = runs[runs.length - 1].text.replace(/\s+$/, "");
      }
      lines[i].runs = runs.filter((r) => r.text.length > 0);
    }
    // Blank interior lines are real (a pre-wrap field can contain them) and stay
    // as empty paragraphs; blank trailing lines are noise.
    while (lines.length && lines[lines.length - 1].runs.length === 0) lines.pop();
    while (lines.length && lines[0].runs.length === 0) lines.shift();
    const kept = lines;
    if (kept.length === 0) return;
    let anyText = false;
    for (let i = 0; i < kept.length; i++) if (kept[i].runs.length) anyText = true;
    if (!anyText) return;

    // Line height: explicit px when set, else the element's own measured line
    // box (`normal` on kickers), else font metrics.
    let lineHeightPx: number;
    if (cs.lineHeight.indexOf("px") !== -1) {
      lineHeightPx = num(cs.lineHeight);
    } else {
      const guess = el.clientHeight / kept.length;
      const fb = fm.ascent + fm.descent;
      lineHeightPx = guess > fb * 0.8 && guess < fb * 3 ? guess : fb;
    }

    // Alignment from measured geometry, not `text-align` — flexbox centring is
    // invisible to `text-align` but obvious in the numbers.
    let leftGap = Infinity;
    let rightGap = Infinity;
    let topMin = Infinity;
    for (let i = 0; i < kept.length; i++) {
      if (kept[i].left !== Infinity) {
        leftGap = Math.min(leftGap, kept[i].left - contentL);
        rightGap = Math.min(rightGap, contentR - kept[i].right);
        topMin = Math.min(topMin, kept[i].top);
      }
    }
    if (!isFinite(leftGap)) { leftGap = 0; rightGap = 0; }
    if (!isFinite(topMin)) topMin = box.y + inset.t;
    let align: "left" | "center" | "right" = "left";
    if (leftGap > 2 && Math.abs(leftGap - rightGap) <= 2) align = "center";
    else if (leftGap > 2 && rightGap <= 2) align = "right";

    // CSS centres the font box inside the line box (half-leading).
    const halfLeading = (lineHeightPx - (fm.ascent + fm.descent)) / 2;
    const firstLineTop = topMin - halfLeading;

    // Measure the first line's baseline directly: the font box top of the first
    // rendered character plus that font's ascent. The builder anchors to this,
    // because PowerPoint and CSS disagree about where the first line sits
    // inside an exact line box.
    let firstBaseline = topMin + fm.ascent;
    const fnode = nodes[0].node;
    for (let j = 0; j < fnode.data.length; j++) {
      range.setStart(fnode, j);
      range.setEnd(fnode, j + 1);
      const fr = range.getBoundingClientRect();
      if (fr.height > 0) { firstBaseline = fr.top - originY + fm.ascent; break; }
    }

    push({
      kind: "text",
      x: contentL, y: firstLineTop, w: Math.max(1, contentR - contentL), h: lineHeightPx * kept.length,
      rot: box.rot,
      paras: kept.map((l) => ({ runs: l.runs })),
      pinned: kept.length > 1,
      align,
      lineHeightPx,
      firstBaselinePx: firstBaseline,
      firstLineTopPx: firstLineTop,
      ascentPx: fm.ascent,
      descentPx: fm.descent,
    });
  }

  // ── the walk ─────────────────────────────────────────────────────────────
  const INLINE = /^inline/;

  /**
   * A text leaf owns its text outright: every descendant is inline and paints
   * nothing of its own, so they are all just runs. An inline descendant that
   * paints (the coral bullet markers in two-column-compare are `<span>`s with a
   * background) forces a recurse instead, so its shape is not swallowed.
   */
  function isTextLeaf(el: HTMLElement): boolean {
    if (!el.textContent || !el.textContent.trim()) return false;
    const kids = el.getElementsByTagName("*");
    for (let i = 0; i < kids.length; i++) {
      const k = kids[i] as HTMLElement;
      const tag = k.tagName.toLowerCase();
      if (tag === "img" || tag === "svg" || tag === "canvas" || tag === "video") return false;
      const kcs = getComputedStyle(k);
      if (!INLINE.test(kcs.display)) return false;
      if (hasChrome(kcs, rectOf(k))) return false;
    }
    return true;
  }

  /** Non-whitespace text sitting directly inside a non-leaf element. */
  function hasDirectText(el: HTMLElement): boolean {
    for (let i = 0; i < el.childNodes.length; i++) {
      const c = el.childNodes[i];
      if (c.nodeType === 3 && (c as Text).data.trim()) return true;
    }
    return false;
  }

  async function walk(el: HTMLElement, ctx: Ctx, isRoot: boolean): Promise<void> {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;

    const opacity = ctx.opacity * (cs.opacity === "" ? 1 : num(cs.opacity));
    if (opacity < 0.005) return;

    const box = boxOf(el, cs);
    if (box.w <= 0 && box.h <= 0) return;

    // Backdrop for flattening translucent text below this point.
    const bg = parseColor(cs.backgroundColor);
    let backdrop = ctx.backdrop;
    if (bg.a * opacity > 0.995) backdrop = { r: bg.r, g: bg.g, b: bg.b, a: 1 };

    // A rounded clipping ancestor is how every photo in the deck gets its
    // rounded corners (ImageBox sets overflow:hidden + border-radius).
    let round = ctx.round;
    const clips = cs.overflow === "hidden" || cs.overflow === "clip" || cs.overflowX === "hidden";
    const rad = radiusOf(cs, box);
    if (clips && rad > 0.5) round = { rect: box, radius: rad };

    const next: Ctx = { backdrop, opacity, round };

    // The Stage itself becomes the slide background, not a shape.
    if (!isRoot && hasChrome(cs, box)) emitChrome(el, cs, next);

    const tag = el.tagName.toLowerCase();
    if (tag === "img") {
      const data = rasterImage(el as HTMLImageElement, box, cs, next);
      if (data) push({ kind: "image", x: box.x, y: box.y, w: box.w, h: box.h, rot: box.rot, data });
      return;
    }
    if (tag === "svg") {
      const data = await rasterSvg(el as unknown as SVGElement, box, cs);
      if (data) push({ kind: "image", x: box.x, y: box.y, w: box.w, h: box.h, rot: box.rot, data });
      return;
    }

    if (isTextLeaf(el)) {
      emitText(el, cs, next, false);
      return;
    }
    if (hasDirectText(el)) {
      // Text mixed with block children — emit just the loose text nodes.
      emitText(el, cs, next, true);
    }

    // CSS paint order (simplified): in-flow content first, then positioned
    // boxes in z-index order. This is what puts title-hero's coral dot over the
    // photo and step-timeline's connector rule over the numerals.
    const flow: HTMLElement[] = [];
    const positioned: { el: HTMLElement; z: number; i: number }[] = [];
    for (let i = 0; i < el.children.length; i++) {
      const child = el.children[i] as HTMLElement;
      const ccs = getComputedStyle(child);
      if (ccs.position !== "static") {
        const z = ccs.zIndex === "auto" || ccs.zIndex === "" ? 0 : parseInt(ccs.zIndex, 10) || 0;
        positioned.push({ el: child, z, i });
      } else {
        flow.push(child);
      }
    }
    for (let i = 0; i < flow.length; i++) await walk(flow[i], next, false);
    positioned.sort((a, b) => (a.z - b.z) || (a.i - b.i));
    for (let i = 0; i < positioned.length; i++) await walk(positioned[i].el, next, false);
  }

  // ── per-slide driver ─────────────────────────────────────────────────────
  const slideEls = document.querySelectorAll(".print-slide");
  const slides: ExtractResult["slides"] = [];

  for (let s = 0; s < slideEls.length; s++) {
    const host = slideEls[s] as HTMLElement;
    const stage = (host.querySelector(".slide-stage") as HTMLElement) || host;
    const hostRect = host.getBoundingClientRect();
    originX = hostRect.left;
    originY = hostRect.top;

    const stageCs = getComputedStyle(stage);
    const stageBg = parseColor(stageCs.backgroundColor);
    const fill = stageBg.a > 0.004 ? toHex(stageBg) : "FFFFFF";
    const backdrop: RGBA = stageBg.a > 0.004 ? { r: stageBg.r, g: stageBg.g, b: stageBg.b, a: 1 } : { r: 255, g: 255, b: 255, a: 1 };

    marks = [];
    await walk(stage, { backdrop, opacity: 1, round: null }, true);

    slides.push({
      w: Math.round(hostRect.width),
      h: Math.round(hostRect.height),
      fill,
      marks: marks as ExtractResult["slides"][number]["marks"],
    });
  }

  return { slides, warnings };
}
