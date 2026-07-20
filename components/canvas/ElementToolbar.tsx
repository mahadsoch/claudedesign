"use client";

import { useRef } from "react";
import type { Slide } from "@/lib/model/deck";
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
  const reattach = useDeck((s) => s.reattachSlide);
  const bump = useDeck((s) => s.bumpImages);
  const fileRef = useRef<HTMLInputElement>(null);

  const one = selectedIds.length === 1 ? selectedIds[0] : null;
  const el = one ? slide.elements?.find((e) => e.id === one) : null;

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
          <button className="ct-btn" title="Bring forward" onClick={() => reorderElement(slide.id, el.id, "forward")}>↑</button>
          <button className="ct-btn" title="Send backward" onClick={() => reorderElement(slide.id, el.id, "backward")}>↓</button>
          <button className="ct-btn" title="Duplicate" onClick={() => duplicateElement(slide.id, el.id)}>⧉</button>
        </>
      ) : (
        <span className="ct-hint">
          {selectedIds.length > 1 ? `${selectedIds.length} selected` : "Click an element to edit · double-click text to type"}
        </span>
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
