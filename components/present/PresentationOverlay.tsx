"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { RenderCtx } from "@/components/templates/types";
import { SlideRenderer } from "@/components/SlideRenderer";
import { useDeck } from "@/lib/state/deckStore";
import { useUI } from "@/lib/state/uiStore";

// Full-screen presentation. Renders the same SlideRenderer as the editor and PDF
// (so what you present matches exactly), scaled to fit the viewport. Keyboard:
// ←/→/Space to move, Esc to exit, N to toggle speaker notes. All state lives in
// the UI store, never the deck — presenting never mutates or autosaves anything.
export function PresentationOverlay({ ctx }: { ctx: RenderCtx }) {
  const presenting = useUI((s) => s.presenting);
  const index = useUI((s) => s.presentIndex);
  const setIndex = useUI((s) => s.setPresentIndex);
  const stop = useUI((s) => s.stopPresenting);
  const slides = useDeck((s) => s.deck.slides);

  const wrapRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.5);
  const [showNotes, setShowNotes] = useState(false);

  const clamp = useCallback((i: number) => Math.max(0, Math.min(i, slides.length - 1)), [slides.length]);

  useEffect(() => {
    if (!presenting) return;
    const el = wrapRef.current;
    if (!el) return;
    const fit = () => {
      const availH = el.clientHeight - (showNotes ? 180 : 0);
      setScale(Math.min(el.clientWidth / STAGE_W, availH / STAGE_H));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [presenting, showNotes]);

  useEffect(() => {
    if (!presenting) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        setIndex(clamp(index + 1));
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        setIndex(clamp(index - 1));
      } else if (e.key === "Escape") {
        stop();
      } else if (e.key.toLowerCase() === "n") {
        setShowNotes((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [presenting, index, clamp, setIndex, stop]);

  // Best-effort real fullscreen; the fixed overlay covers the screen regardless.
  useEffect(() => {
    if (!presenting) return;
    const el = document.documentElement;
    el.requestFullscreen?.().catch(() => {});
    return () => {
      if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
    };
  }, [presenting]);

  if (!presenting) return null;
  const slide = slides[clamp(index)];
  if (!slide) return null;

  return (
    <div className="present-root">
      <div className="present-stage-wrap" ref={wrapRef}>
        <div
          style={{
            width: STAGE_W * scale,
            height: STAGE_H * scale,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div style={{ transformOrigin: "top left", transform: `scale(${scale})` }}>
            <SlideRenderer slide={slide} ctx={ctx} />
          </div>
        </div>
        {showNotes && (
          <div className="present-notes">
            {slide.notes?.trim() || "No notes for this slide."}
          </div>
        )}
      </div>

      <div className="present-bar">
        <button className="btn" onClick={() => setIndex(clamp(index - 1))} disabled={index <= 0}>
          ‹ Prev
        </button>
        <span style={{ font: "500 12px var(--font-mono)", color: "#bbb", minWidth: 70, textAlign: "center" }}>
          {index + 1} / {slides.length}
        </span>
        <button
          className="btn"
          onClick={() => setIndex(clamp(index + 1))}
          disabled={index >= slides.length - 1}
        >
          Next ›
        </button>
        <div style={{ width: 1, height: 22, background: "#333", margin: "0 4px" }} />
        <button className="btn" onClick={() => setShowNotes((v) => !v)} title="Toggle speaker notes (N)">
          {showNotes ? "Hide notes" : "Notes"}
        </button>
        <button className="btn primary" onClick={stop} title="Exit (Esc)">
          Exit
        </button>
      </div>
    </div>
  );
}
