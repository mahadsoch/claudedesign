"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide } from "@/lib/model/deck";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { BaseRenderCtx } from "@/components/templates/types";
import { SlideRenderer } from "@/components/SlideRenderer";
import { CanvasStage } from "@/components/canvas/CanvasStage";
import { ElementToolbar } from "@/components/canvas/ElementToolbar";
import { useDeck } from "@/lib/state/deckStore";

const ZOOM_STEPS = [0.25, 0.4, 0.5, 0.75, 1, 1.5, 2];

/**
 * Renders a slide at true 1920×1080, scaled to fit or to an explicit zoom.
 * Detached slides render the interactive CanvasStage; template slides render
 * the static SlideRenderer.
 */
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
  const [fitScale, setFitScale] = useState(0.4);
  /** null = fit to the window; a number = an explicit zoom the user chose. */
  const [zoom, setZoom] = useState<number | null>(null);
  const selectElements = useDeck((s) => s.selectElements);
  const setEditing = useDeck((s) => s.setEditingElement);
  const detached = !!(slide.elements && slide.elements.length > 0);
  const scale = zoom ?? fitScale;

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const pad = detached ? 96 : 48;
      const availW = el.clientWidth - pad;
      const availH = el.clientHeight - pad - (detached ? 44 : 0);
      setFitScale(Math.min(availW / STAGE_W, availH / STAGE_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [detached]);

  const step = useCallback(
    (dir: 1 | -1) => {
      setZoom((z) => {
        const cur = z ?? fitScale;
        const next =
          dir > 0
            ? (ZOOM_STEPS.find((s) => s > cur + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1])
            : ([...ZOOM_STEPS].reverse().find((s) => s < cur - 0.001) ?? ZOOM_STEPS[0]);
        return next;
      });
    },
    [fitScale]
  );

  // ⌘0 fits, ⌘1 goes to 100%, ⌘± steps. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const el = document.activeElement as HTMLElement | null;
      if (el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA" || el.isContentEditable)) return;
      if (e.key === "0") {
        e.preventDefault();
        setZoom(null);
      } else if (e.key === "1") {
        e.preventDefault();
        setZoom(1);
      } else if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        step(1);
      } else if (e.key === "-") {
        e.preventDefault();
        step(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step]);

  const zoomed = zoom != null && zoom > fitScale;

  // Overflow guard. The stage clips, so on screen an over-long field just looks
  // cropped — but the PPTX exporter does NOT clip text, so the same slide spills
  // over its edges in the file the client opens. Surface it while editing.
  const [overflow, setOverflow] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const stage = wrapRef.current?.querySelector(".slide-stage");
      if (!stage) return setOverflow(false);
      setOverflow(stage.scrollHeight > STAGE_H + 2 || stage.scrollWidth > STAGE_W + 2);
    });
    return () => cancelAnimationFrame(id);
  }, [slide, scale]);

  return (
    <div
      className="stage-wrap"
      ref={wrapRef}
      style={{
        flexDirection: "column",
        // Once past the fit scale the stage no longer fits its box, so the wrap
        // has to scroll rather than clip.
        overflow: zoomed ? "auto" : "hidden",
        justifyContent: zoomed ? "flex-start" : "center",
        alignItems: zoomed ? "flex-start" : "center",
        padding: zoomed ? 24 : 0,
      }}
    >
      {detached && <ElementToolbar slide={slide} />}
      <div
        style={{
          width: STAGE_W * scale,
          height: STAGE_H * scale,
          flex: "none",
          margin: zoomed ? "auto" : undefined,
          boxShadow: "0 12px 48px rgba(0,0,0,0.5)",
          borderRadius: 8 * Math.min(scale, 1),
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
            <SlideRenderer slide={slide} ctx={ctx} slideNumber={slideNumber} slideCount={slideCount} />
          )}
        </div>
      </div>

      {overflow && (
        <div className="overflow-warn" title="Content is taller or wider than the 1920×1080 stage. The editor clips it, but PowerPoint will not — shorten the copy or remove an item.">
          ⚠ Content overflows the slide
        </div>
      )}

      <div className="zoombar">
        <button title="Zoom out (⌘−)" onClick={() => step(-1)}>
          −
        </button>
        <span className="pct">{Math.round(scale * 100)}%</span>
        <button title="Zoom in (⌘+)" onClick={() => step(1)}>
          +
        </button>
        <button title="Fit to window (⌘0)" onClick={() => setZoom(null)} style={{ opacity: zoom == null ? 1 : 0.7 }}>
          Fit
        </button>
        <button title="Actual size (⌘1)" onClick={() => setZoom(1)}>
          100%
        </button>
      </div>
    </div>
  );
}
