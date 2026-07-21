"use client";

import { useDeck } from "@/lib/state/deckStore";
import type { RenderCtx } from "@/components/templates/types";
import { SlideThumb } from "./SlideThumb";

export function SlidePalette({ ctx, onBrowse }: { ctx: RenderCtx; onBrowse: () => void }) {
  const deck = useDeck((s) => s.deck);
  const selectedId = useDeck((s) => s.selectedId);
  const select = useDeck((s) => s.select);

  return (
    <div className="palette">
      <div className="section-label">Slides · {deck.slides.length}</div>
      {deck.slides.map((slide, i) => (
        <SlideThumb
          key={slide.id}
          slide={slide}
          index={i}
          active={slide.id === selectedId}
          ctx={ctx}
          onClick={() => select(slide.id)}
        />
      ))}

      <button className="btn primary" style={{ width: "100%", marginTop: 6 }} onClick={onBrowse}>
        + Add slide from template
      </button>
    </div>
  );
}
