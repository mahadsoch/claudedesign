"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/model/deck";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { BaseRenderCtx } from "@/components/templates/types";
import { SlideRenderer } from "@/components/SlideRenderer";

/** A tiny scaled render of a slide for the palette rail. */
export function SlideThumb({
  slide,
  index,
  active,
  selected,
  dropBefore,
  dropAfter,
  ctx,
  onPointerDown,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  onContextMenu,
}: {
  slide: Slide;
  index: number;
  /** The slide shown on the stage. */
  active: boolean;
  /** Part of the current multi-selection. */
  selected: boolean;
  dropBefore?: boolean;
  dropAfter?: boolean;
  ctx: BaseRenderCtx;
  onPointerDown: (e: React.MouseEvent) => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onContextMenu: (e: React.MouseEvent) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.12);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / STAGE_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const cls = [
    "thumb",
    active ? "active" : "",
    selected && !active ? "selected" : "",
    dropBefore ? "drop-before" : "",
    dropAfter ? "drop-after" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={ref}
      className={cls}
      draggable
      onMouseDown={onPointerDown}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onContextMenu={onContextMenu}
    >
      <span className="idx">{index + 1}</span>
      <div className="thumb-scale" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
        <SlideRenderer slide={slide} ctx={ctx} slideNumber={index + 1} />
      </div>
    </div>
  );
}
