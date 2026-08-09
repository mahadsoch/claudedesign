"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/model/deck";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { BaseRenderCtx } from "@/components/templates/types";
import { SlideRenderer } from "@/components/SlideRenderer";
import { CanvasStage } from "@/components/canvas/CanvasStage";
import { ElementToolbar } from "@/components/canvas/ElementToolbar";
import { useDeck } from "@/lib/state/deckStore";

/** Renders a slide at true 1920×1080, scaled to fit. Detached slides render the
 *  interactive CanvasStage; template slides render the static SlideRenderer. */
export function PreviewStage({
  slide,
  ctx,
  slideNumber,
  slideCount,
}: {
  slide: Slide;
  ctx: BaseRenderCtx;
  slideNumber?: number;
  slideCount?: number;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);
  const selectElements = useDeck((s) => s.selectElements);
  const setEditing = useDeck((s) => s.setEditingElement);
  const detached = !!(slide.elements && slide.elements.length > 0);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const pad = detached ? 96 : 48;
      const availW = el.clientWidth - pad;
      const availH = el.clientHeight - pad - (detached ? 44 : 0);
      setScale(Math.min(availW / STAGE_W, availH / STAGE_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detached]);

  return (
    <div className="stage-wrap" style={{ flexDirection: "column" }}>
      {detached && <ElementToolbar slide={slide} />}
      <div
        style={{
          width: STAGE_W * scale,
          height: STAGE_H * scale,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          borderRadius: 8 * scale,
          overflow: detached ? "visible" : "hidden",
          position: "relative",
        }}
        // clicking empty canvas clears selection
        onMouseDown={(e) => {
          if (detached && e.target === e.currentTarget) {
            selectElements([]);
            setEditing(null);
          }
        }}
      >
        <div style={{ transformOrigin: "top left", transform: `scale(${scale})` }}>
          {detached ? (
            <CanvasStage slide={slide} scale={scale} ctx={ctx} />
          ) : (
            <SlideRenderer
              slide={slide}
              ctx={ctx}
              slideNumber={slideNumber}
              slideCount={slideCount}
            />
          )}
        </div>
      </div>
    </div>
  );
}
