"use client";

import { useState } from "react";
import { useDeck } from "@/lib/state/deckStore";
import type { RenderCtx } from "@/components/templates/types";
import { TEMPLATES } from "@/components/templates/registry";
import { SlideThumb } from "./SlideThumb";

export function SlidePalette({ ctx }: { ctx: RenderCtx }) {
  const deck = useDeck((s) => s.deck);
  const selectedId = useDeck((s) => s.selectedId);
  const select = useDeck((s) => s.select);
  const addSlide = useDeck((s) => s.addSlide);
  const [adding, setAdding] = useState(false);

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

      <button className="btn" style={{ width: "100%", marginTop: 6 }} onClick={() => setAdding((v) => !v)}>
        + Add slide
      </button>

      {adding && (
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 4 }}>
          {TEMPLATES.map((t) => (
            <button
              key={t.id}
              className="btn"
              style={{ textAlign: "left" }}
              onClick={() => {
                addSlide(t.id);
                setAdding(false);
              }}
            >
              {t.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
