"use client";

import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
import type { ReactElement } from "react";
import { STAGE_W, STAGE_H, uid, type SlideElement } from "@/lib/model/deck";

/**
 * Turn a rendered template into freeform elements by MEASURING it, rather than
 * by re-implementing its layout.
 *
 * This is the same principle the PPTX exporter is built on, applied to
 * "Detach to canvas". Hand-written `expand()` functions were only ever written
 * for 5 of the 33 templates, and every one of them had already drifted from its
 * own `render()` — `contact-cta` rendered its title at −4 letter-spacing while
 * its expand said −3, and `content-list-figures` stepped rows by a fixed 160px
 * against a flow layout whose rows vary in height. Measuring cannot drift.
 *
 * Note: element↔field links (`fieldKey`) are not recovered, because the DOM does
 * not carry them. Nothing reads `fieldKey` today — detach has always been
 * one-way — so this loses no behaviour.
 */

const FONT_VARS: [RegExp, string][] = [
  [/poppins/i, "var(--font-title)"],
  [/jetbrains/i, "var(--font-mono)"],
  [/open sans/i, "var(--font-body)"],
];

function fontVar(family: string): string {
  for (const [re, v] of FONT_VARS) if (re.test(family)) return v;
  return "var(--font-body)";
}

const num = (v: string): number => {
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : 0;
};

/** A colour that paints nothing. */
function invisible(colour: string): boolean {
  return !colour || colour === "transparent" || /rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*0\s*\)/.test(colour);
}

/** True when this node's own text should be captured (it is a text leaf). */
function isTextLeaf(el: Element): boolean {
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE && (child.textContent ?? "").trim()) return true;
  }
  return false;
}

/**
 * Rebuild the text of a node, re-encoding any differently-coloured inline span
 * as `[[…]]` so the accent survives into the freeform renderer, which parses
 * that syntax back out.
 */
function textOf(el: Element, ownColour: string): string {
  let out = "";
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      out += child.textContent ?? "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const c = child as Element;
      const cs = getComputedStyle(c);
      const inner = c.textContent ?? "";
      out += cs.color !== ownColour && inner.trim() ? `[[${inner}]]` : inner;
    }
  }
  return out.replace(/\s+/g, " ").trim();
}

/** Rotation baked into the computed `transform`, in degrees. */
function rotationOf(cs: CSSStyleDeclaration): number {
  const t = cs.transform;
  if (!t || t === "none") return 0;
  const nums = t.match(/matrix(?:3d)?\(([^)]+)\)/);
  if (!nums) return 0;
  const v = nums[1].split(",").map((n) => parseFloat(n));
  // matrix(a, b, c, d, e, f) — the rotation is atan2(b, a).
  const [a, b] = t.startsWith("matrix3d") ? [v[0], v[1]] : [v[0], v[1]];
  const deg = Math.round((Math.atan2(b, a) * 180) / Math.PI);
  return Object.is(deg, -0) ? 0 : deg;
}

/**
 * The element's box in stage coordinates. `getBoundingClientRect` returns the
 * *rotated* bounds, so for a rotated node the unrotated size is recovered from
 * offsetWidth/Height and centred on the same point — otherwise a rotated label
 * would come back as a tall narrow box and re-wrap.
 */
function rectOf(el: Element, originX: number, originY: number, rotation: number) {
  const r = el.getBoundingClientRect();
  if (rotation === 0 || !(el instanceof HTMLElement)) {
    return {
      x: Math.round(r.left - originX),
      y: Math.round(r.top - originY),
      w: Math.round(r.width),
      h: Math.round(r.height),
    };
  }
  const w = el.offsetWidth || Math.round(r.width);
  const h = el.offsetHeight || Math.round(r.height);
  const cx = r.left + r.width / 2 - originX;
  const cy = r.top + r.height / 2 - originY;
  return { x: Math.round(cx - w / 2), y: Math.round(cy - h / 2), w, h };
}

function walk(root: Element, originX: number, originY: number): SlideElement[] {
  const out: SlideElement[] = [];

  const visit = (el: Element, isRoot: boolean) => {
    const cs = getComputedStyle(el);
    if (cs.display === "none" || cs.visibility === "hidden") return;
    const rotation = rotationOf(cs);
    const box = rectOf(el, originX, originY, rotation);
    const tag = el.tagName.toLowerCase();

    // Images and icons are leaves.
    if (tag === "img") {
      if (box.w > 0 && box.h > 0) {
        out.push({
          id: uid("el"),
          type: "image",
          ...box,
          rotation,
          style: {
            objectFit: cs.objectFit || "cover",
            ...(num(cs.borderTopLeftRadius) > 0.5 ? { borderRadius: Math.round(num(cs.borderTopLeftRadius)) } : null),
          },
          // The stage is rendered with an identity image resolver, so `src` is
          // still the original ref ("blob:…", "icon:…" or a path).
          content: el.getAttribute("src") ?? "",
        });
      }
      return;
    }

    if (tag === "svg") {
      // Inline icons are serialised to a data URL, which the image element
      // renders as-is. The glyph is preserved exactly; it stops being
      // recolourable, which is the right trade for a freeform override.
      if (box.w > 0 && box.h > 0) {
        const clone = el.cloneNode(true) as SVGElement;
        clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
        clone.setAttribute("width", String(box.w));
        clone.setAttribute("height", String(box.h));
        // Strip the node's own rotation: it now lives on the element, and
        // leaving it here would apply the turn twice.
        clone.setAttribute("style", `color:${cs.color};transform:none`);
        const data =
          "data:image/svg+xml;charset=utf-8," +
          encodeURIComponent(new XMLSerializer().serializeToString(clone));
        out.push({
          id: uid("el"),
          type: "image",
          ...box,
          rotation,
          style: { objectFit: "contain" },
          content: data,
        });
      }
      return;
    }

    // A painted box becomes a shape. The stage itself is skipped — its fill is
    // the slide background, which the freeform stage already draws.
    if (!isRoot && box.w > 0.5 && box.h > 0.5) {
      const bg = cs.backgroundColor;
      const bw = num(cs.borderTopWidth);
      const bc = cs.borderTopColor;
      const paints = !invisible(bg) || (bw > 0 && !invisible(bc));
      if (paints) {
        out.push({
          id: uid("el"),
          type: "shape",
          ...box,
          rotation,
          style: {
            ...(invisible(bg) ? null : { background: bg }),
            ...(bw > 0 && !invisible(bc) ? { border: `${bw}px solid ${bc}` } : null),
            ...(num(cs.borderTopLeftRadius) > 0.5
              ? { borderRadius: Math.round(num(cs.borderTopLeftRadius)) }
              : null),
          },
        });
      }
    }

    // Text is emitted after the box it sits in, so it lands on top.
    if (isTextLeaf(el)) {
      const content = textOf(el, cs.color);
      if (content) {
        out.push({
          id: uid("el"),
          type: "text",
          ...box,
          // Round the text box *up*: rounding down by a fraction of a pixel is
          // enough to make a line that fitted re-wrap, and the freeform renderer
          // clips, so the tail would silently vanish.
          w: Math.ceil(box.w) + 1,
          h: Math.ceil(box.h) + 1,
          rotation,
          style: {
            fontFamily: fontVar(cs.fontFamily),
            fontSize: Math.round(num(cs.fontSize)),
            fontWeight: Number(cs.fontWeight) || 400,
            lineHeight: cs.lineHeight === "normal" ? 1.2 : num(cs.lineHeight) / Math.max(num(cs.fontSize), 1),
            letterSpacing: cs.letterSpacing === "normal" ? 0 : Math.round(num(cs.letterSpacing)),
            color: cs.color,
            textAlign: cs.textAlign === "start" ? "left" : cs.textAlign,
            ...(cs.textTransform !== "none" ? { textTransform: cs.textTransform } : null),
            // Vertical axis labels rely on writing-mode; without it the box
            // would be re-measured horizontally and the label would clip.
            ...(cs.writingMode && cs.writingMode !== "horizontal-tb"
              ? { writingMode: cs.writingMode }
              : null),
            ...(num(cs.opacity) < 0.995 ? { opacity: num(cs.opacity) } : null),
          },
          content,
        });
      }
      return; // a text leaf owns its subtree
    }

    for (const child of Array.from(el.children)) visit(child, false);
  };

  visit(root, true);
  return out;
}

/**
 * Render `node` offscreen at true 1920×1080, measure it, and return the
 * equivalent freeform elements. Browser-only.
 */
export function expandFromDom(node: ReactElement): SlideElement[] {
  if (typeof document === "undefined") return [];
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;left:-10000px;top:0;width:${STAGE_W}px;height:${STAGE_H}px;pointer-events:none;`;
  document.body.appendChild(host);
  const root = createRoot(host);
  try {
    // flushSync so the tree is in the DOM before we measure it.
    flushSync(() => root.render(node));
    const stage = host.querySelector(".slide-stage");
    if (!stage) return [];
    const r = stage.getBoundingClientRect();
    return walk(stage, r.left, r.top);
  } finally {
    // Unmounting synchronously from inside a commit is disallowed, so defer it.
    setTimeout(() => {
      root.unmount();
      host.remove();
    }, 0);
  }
}
