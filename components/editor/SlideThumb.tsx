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
  ctx,
  onClick,
}: {
  slide: Slide;
  index: number;
  active: boolean;
  ctx: BaseRenderCtx;
  onClick: () => void;
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

  return (
    <div ref={ref} className={`thumb ${active ? "active" : ""}`} onClick={onClick}>
      <span className="idx">{index + 1}</span>
      <div className="thumb-scale" style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}>
        <SlideRenderer slide={slide} ctx={ctx} />
      </div>
    </div>
  );
}
