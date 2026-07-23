"use client";

import { useState } from "react";
import { useDeck } from "@/lib/state/deckStore";
import type { RenderCtx } from "@/components/templates/types";
import { SlideThumb } from "./SlideThumb";

export function SlidePalette({ ctx, onBrowse }: { ctx: RenderCtx; onBrowse: () => void }) {
  const deck = useDeck((s) => s.deck);
  const selectedId = useDeck((s) => s.selectedId);
  const select = useDeck((s) => s.select);
  const moveSlideTo = useDeck((s) => s.moveSlideTo);

  const [dragId, setDragId] = useState<string | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  return (
    <div className="palette">
      <div className="section-label">Slides · {deck.slides.length}</div>
      {deck.slides.map((slide, i) => (
        <div
          key={slide.id}
          draggable
          className={
            "thumb-drag" +
            (dragId && dragId !== slide.id && overIndex === i ? " drop-target" : "") +
            (dragId === slide.id ? " dragging" : "")
          }
          onDragStart={(e) => {
            setDragId(slide.id);
            e.dataTransfer.effectAllowed = "move";
          }}
          onDragEnd={() => {
            setDragId(null);
            setOverIndex(null);
          }}
          onDragOver={(e) => {
            if (!dragId) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = "move";
            if (overIndex !== i) setOverIndex(i);
          }}
          onDrop={(e) => {
            e.preventDefault();
            if (dragId) moveSlideTo(dragId, i);
            setDragId(null);
            setOverIndex(null);
          }}
        >
          <SlideThumb
            slide={slide}
            index={i}
            active={slide.id === selectedId}
            ctx={ctx}
            onClick={() => select(slide.id)}
          />
        </div>
      ))}

      <button className="btn primary" style={{ width: "100%", marginTop: 6 }} onClick={onBrowse}>
        + Add slide from template
      </button>
    </div>
  );
}
