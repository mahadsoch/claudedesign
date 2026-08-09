"use client";

import { useRef } from "react";
import type { Slide, SlideElement } from "@/lib/model/deck";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import { useDeck } from "@/lib/state/deckStore";
import { PALETTE, TYPE_SCALE } from "@/lib/canvas/brand";
import { storeUpload } from "@/lib/persistence/imageStore";

export function ElementToolbar({ slide }: { slide: Slide }) {
  const selectedIds = useDeck((s) => s.selectedElementIds);
  const addElement = useDeck((s) => s.addElement);
  const updateElementStyle = useDeck((s) => s.updateElementStyle);
  const removeElements = useDeck((s) => s.removeElements);
  const duplicateElement = useDeck((s) => s.duplicateElement);
  const reorderElement = useDeck((s) => s.reorderElement);
  const commitGeometry = useDeck((s) => s.commitGeometry);
  const reattach = useDeck((s) => s.reattachSlide);
  const bump = useDeck((s) => s.bumpImages);
  const fileRef = useRef<HTMLInputElement>(null);

  const one = selectedIds.length === 1 ? selectedIds[0] : null;
  const el = one ? slide.elements?.find((e) => e.id === one) : null;
  const picked = (slide.elements ?? []).filter((e) => selectedIds.includes(e.id));

  /**
   * Align or distribute the selection. With one element selected the reference
   * is the stage, so "centre" means centred on the slide; with several it is
   * their common bounding box.
   */
  function align(op: "left" | "hcentre" | "right" | "top" | "vmiddle" | "bottom" | "hdist" | "vdist") {
    if (picked.length === 0) return;
    const solo = picked.length === 1;
    const minX = solo ? 0 : Math.min(...picked.map((e) => e.x));
    const maxX = solo ? STAGE_W : Math.max(...picked.map((e) => e.x + e.w));
    const minY = solo ? 0 : Math.min(...picked.map((e) => e.y));
    const maxY = solo ? STAGE_H : Math.max(...picked.map((e) => e.y + e.h));
    const geo: Record<string, Partial<SlideElement>> = {};

    if (op === "hdist" || op === "vdist") {
      // Even gaps need at least three boxes to distribute between the outer two.
      if (picked.length < 3) return;
      const horiz = op === "hdist";
      const sorted = [...picked].sort((a, b) => (horiz ? a.x - b.x : a.y - b.y));
      const span = horiz
        ? sorted[sorted.length - 1].x - sorted[0].x
        : sorted[sorted.length - 1].y - sorted[0].y;
      const stepPx = span / (sorted.length - 1);
      sorted.forEach((e, i) => {
        if (i === 0 || i === sorted.length - 1) return;
        const v = Math.round((horiz ? sorted[0].x : sorted[0].y) + stepPx * i);
        geo[e.id] = horiz ? { x: v } : { y: v };
      });
      commitGeometry(slide.id, geo);
      return;
    }

    for (const e of picked) {
      if (op === "left") geo[e.id] = { x: Math.round(minX) };
      else if (op === "right") geo[e.id] = { x: Math.round(maxX - e.w) };
      else if (op === "hcentre") geo[e.id] = { x: Math.round((minX + maxX) / 2 - e.w / 2) };
      else if (op === "top") geo[e.id] = { y: Math.round(minY) };
      else if (op === "bottom") geo[e.id] = { y: Math.round(maxY - e.h) };
      else if (op === "vmiddle") geo[e.id] = { y: Math.round((minY + maxY) / 2 - e.h / 2) };
    }
    commitGeometry(slide.id, geo);
  }

  const ALIGN_BUTTONS = [
    { op: "left", label: "\u21E4", title: "Align left" },
    { op: "hcentre", label: "\u21FF", title: "Align horizontal centres" },
    { op: "right", label: "\u21E5", title: "Align right" },
    { op: "top", label: "\u2912", title: "Align top" },
    { op: "vmiddle", label: "\u21D5", title: "Align vertical middles" },
    { op: "bottom", label: "\u2913", title: "Align bottom" },
  ] as const;

  return (
    <div className="canvas-toolbar">
      <button className="ct-btn" onClick={() => addElement(slide.id, { type: "text", x: 760, y: 480, w: 500, h: 90, rotation: 0, style: { fontFamily: "var(--font-body)", fontSize: 32, color: "var(--ink)" }, content: "Text" })}>
        + Text
      </button>
      <button className="ct-btn" onClick={() => addElement(slide.id, { type: "shape", x: 780, y: 460, w: 320, h: 200, rotation: 0, style: { background: "var(--coral)", borderRadius: 16 } })}>
        + Rect
      </button>
      <button className="ct-btn" onClick={() => addElement(slide.id, { type: "shape", x: 810, y: 440, w: 240, h: 240, rotation: 0, style: { background: "var(--coral)", borderRadius: 9999 } })}>
        + Circle
      </button>
      <button className="ct-btn" onClick={() => fileRef.current?.click()}>+ Image</button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const ref = await storeUpload(file);
          addElement(slide.id, { type: "image", x: 700, y: 340, w: 520, h: 400, rotation: 0, style: { borderRadius: 16, objectFit: "cover" }, content: ref });
          bump();
        }}
      />

      <div className="ct-sep" />

      {el ? (
        <>
          {el.type === "text" && (
            <>
              <select
                className="ct-select"
                value={Number(el.style.fontSize) || 32}
                onChange={(ev) => updateElementStyle(slide.id, el.id, { fontSize: Number(ev.target.value) })}
                title="Font size"
              >
                {TYPE_SCALE.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
              <button className="ct-btn" title="Bold" onClick={() => updateElementStyle(slide.id, el.id, { fontWeight: Number(el.style.fontWeight) >= 600 ? 400 : 600 })}>
                B
              </button>
              {(["left", "center", "right"] as const).map((a) => (
                <button key={a} className="ct-btn" title={`Align ${a}`} onClick={() => updateElementStyle(slide.id, el.id, { textAlign: a })}>
                  {a === "left" ? "⟵" : a === "center" ? "≡" : "⟶"}
                </button>
              ))}
            </>
          )}
          <div className="ct-swatches">
            {PALETTE.map((c) => (
              <button
                key={c.value}
                className="ct-swatch"
                title={c.label}
                style={{ background: c.value }}
                onClick={() =>
                  updateElementStyle(slide.id, el.id, el.type === "text" ? { color: c.value } : { background: c.value })
                }
              />
            ))}
          </div>
          <div className="ct-sep" />
          {/* The store has supported front/back all along; nothing exposed it. */}
          <button className="ct-btn" title="Bring to front" onClick={() => reorderElement(slide.id, el.id, "front")}>Front</button>
          <button className="ct-btn" title="Bring forward" onClick={() => reorderElement(slide.id, el.id, "forward")}>↑</button>
          <button className="ct-btn" title="Send backward" onClick={() => reorderElement(slide.id, el.id, "backward")}>↓</button>
          <button className="ct-btn" title="Send to back" onClick={() => reorderElement(slide.id, el.id, "back")}>Back</button>
          <button className="ct-btn" title="Duplicate (⌘D)" onClick={() => duplicateElement(slide.id, el.id)}>⧉</button>
        </>
      ) : (
        <span className="ct-hint">
          {selectedIds.length > 1 ? `${selectedIds.length} selected` : "Click an element to edit · double-click text to type"}
        </span>
      )}

      {selectedIds.length > 0 && (
        <>
          <div className="ct-sep" />
          {ALIGN_BUTTONS.map((b) => (
            <button
              key={b.op}
              className={"ct-btn ct-align ct-align-" + b.op}
              title={picked.length > 1 ? b.title : b.title + " (on the slide)"}
              onClick={() => align(b.op)}
            >
              {b.label}
            </button>
          ))}
          <button className="ct-btn" title="Distribute horizontally" disabled={picked.length < 3} onClick={() => align("hdist")}>
            ⇹
          </button>
          <button className="ct-btn" title="Distribute vertically" disabled={picked.length < 3} onClick={() => align("vdist")}>
            ⇳
          </button>
        </>
      )}

      {selectedIds.length > 0 && (
        <button className="ct-btn danger" title="Delete" onClick={() => removeElements(slide.id, selectedIds)}>
          🗑
        </button>
      )}

      <div style={{ flex: 1 }} />
      <button className="ct-btn" onClick={() => reattach(slide.id)} title="Discard freeform edits and return to the template">
        ↩ Reset to template
      </button>
    </div>
  );
}
