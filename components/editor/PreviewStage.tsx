"use client";

import { useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/model/deck";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { RenderCtx } from "@/components/templates/types";
import { SlideRenderer } from "@/components/SlideRenderer";

/** Renders a slide at true 1920×1080, scaled to fit the available box. */
export function PreviewStage({ slide, ctx }: { slide: Slide; ctx: RenderCtx }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.4);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const pad = 48;
      const availW = el.clientWidth - pad;
      const availH = el.clientHeight - pad;
      setScale(Math.min(availW / STAGE_W, availH / STAGE_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={wrapRef} className="stage-wrap">
      <div
        style={{
          width: STAGE_W * scale,
          height: STAGE_H * scale,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          borderRadius: 8 * scale,
          overflow: "hidden",
        }}
      >
        <div style={{ transformOrigin: "top left", transform: `scale(${scale})` }}>
          <SlideRenderer slide={slide} ctx={ctx} />
        </div>
      </div>
    </div>
  );
}
