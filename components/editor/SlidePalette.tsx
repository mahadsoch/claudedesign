"use client";

import { useState } from "react";
import { useDeck } from "@/lib/state/deckStore";
import type { BaseRenderCtx } from "@/components/templates/types";
import { SlideThumb } from "./SlideThumb";

/**
 * The filmstrip. Beyond selecting a slide it now supports what a deck of any
 * length needs: drag to reorder, shift/⌘-click to select several, and a
 * right-click menu for the bulk actions.
 */
export function SlidePalette({ ctx, onBrowse }: { ctx: BaseRenderCtx; onBrowse: () => void }) {
  const deck = useDeck((s) => s.deck);
  const selectedId = useDeck((s) => s.selectedId);
  const selectedIds = useDeck((s) => s.selectedIds);
  const select = useDeck((s) => s.select);
  const toggleSelected = useDeck((s) => s.toggleSlideSelected);
  const selectRange = useDeck((s) => s.selectSlideRange);
  const reorderSlide = useDeck((s) => s.reorderSlide);
  const duplicateSlides = useDeck((s) => s.duplicateSlides);
  const deleteSlides = useDeck((s) => s.deleteSlides);
  const copySlides = useDeck((s) => s.copySlides);
  const pasteSlides = useDeck((s) => s.pasteSlides);

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const count = selectedIds.length;
  const targets = count > 1 ? selectedIds : selectedId ? [selectedId] : [];

  return (
    <div
      className="palette"
      onClick={() => setMenu(null)}
      onContextMenu={(e) => {
        // Only the thumbs open a menu; the empty rail dismisses it.
        if (e.target === e.currentTarget) {
          e.preventDefault();
          setMenu(null);
        }
      }}
    >
      <div className="section-label">
        Slides · {deck.slides.length}
        {count > 1 ? ` · ${count} selected` : ""}
      </div>

      {deck.slides.map((slide, i) => (
        <SlideThumb
          key={slide.id}
          slide={slide}
          index={i}
          active={slide.id === selectedId}
          selected={selectedIds.includes(slide.id)}
          dropBefore={dragFrom != null && dragOver === i && dragFrom > i}
          dropAfter={dragFrom != null && dragOver === i && dragFrom < i}
          ctx={ctx}
          onPointerDown={(e) => {
            setMenu(null);
            if (e.shiftKey) selectRange(slide.id);
            else if (e.metaKey || e.ctrlKey) toggleSelected(slide.id);
            else if (!selectedIds.includes(slide.id) || selectedIds.length === 1) select(slide.id);
            else select(slide.id);
          }}
          onDragStart={() => setDragFrom(i)}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragFrom != null && dragFrom !== i) reorderSlide(dragFrom, i);
            setDragFrom(null);
            setDragOver(null);
          }}
          onDragEnd={() => {
            setDragFrom(null);
            setDragOver(null);
          }}
          onContextMenu={(e) => {
            e.preventDefault();
            if (!selectedIds.includes(slide.id)) select(slide.id);
            setMenu({ x: e.clientX, y: e.clientY });
          }}
        />
      ))}

      <button className="btn primary" style={{ width: "100%", marginTop: 6 }} onClick={onBrowse}>
        + Add slide from template
      </button>

      {menu && (
        <div className="ctx-menu" style={{ left: menu.x, top: menu.y }} onClick={() => setMenu(null)}>
          <button onClick={() => duplicateSlides(targets)}>
            Duplicate{count > 1 ? ` ${count} slides` : ""} <span>⌘D</span>
          </button>
          <button onClick={() => copySlides(targets)}>
            Copy{count > 1 ? ` ${count} slides` : ""} <span>⌘C</span>
          </button>
          <button onClick={() => pasteSlides()}>
            Paste <span>⌘V</span>
          </button>
          <div className="ctx-sep" />
          <button
            className="danger"
            disabled={deck.slides.length <= targets.length}
            onClick={() => deleteSlides(targets)}
          >
            Delete{count > 1 ? ` ${count} slides` : ""} <span>⌫</span>
          </button>
        </div>
      )}
    </div>
  );
}
