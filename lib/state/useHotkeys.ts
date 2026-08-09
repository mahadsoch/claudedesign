"use client";

import { useEffect } from "react";
import { useDeck } from "./deckStore";

/**
 * The editor's keyboard layer.
 *
 * Before this the app had exactly one shortcut (⌘Z), and it bailed out entirely
 * whenever focus was in a field — so undo was unreachable while typing, which is
 * precisely when it is wanted.
 *
 * The rule now: ⌘-chords always work, because a text field's own undo stack is
 * not what the user means by "undo" in a deck editor. Bare keys (Delete, arrows,
 * N) only fire when focus is *not* in a field, so typing is never hijacked.
 */
function isTyping(): boolean {
  const el = document.activeElement as HTMLElement | null;
  if (!el) return false;
  return (
    el.tagName === "INPUT" ||
    el.tagName === "TEXTAREA" ||
    el.tagName === "SELECT" ||
    el.isContentEditable
  );
}

export function useHotkeys({ onBrowseTemplates }: { onBrowseTemplates: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useDeck.getState();
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      const typing = isTyping();

      // Element-level editing on the freeform canvas owns its own keys.
      const editingElement = s.editingElementId != null;
      const targets = s.selectedIds.length ? s.selectedIds : s.selectedId ? [s.selectedId] : [];

      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) s.redo();
        else s.undo();
        return;
      }
      if (mod && key === "y") {
        e.preventDefault();
        s.redo();
        return;
      }

      if (typing || editingElement) return;

      if (mod && key === "c") {
        if (s.selectedElementIds.length) return; // canvas selection, not slides
        e.preventDefault();
        s.copySlides(targets);
        return;
      }
      if (mod && key === "v") {
        e.preventDefault();
        s.pasteSlides();
        return;
      }
      if (mod && key === "d") {
        e.preventDefault();
        if (s.selectedElementIds.length === 1 && s.selectedId) {
          s.duplicateElement(s.selectedId, s.selectedElementIds[0]);
        } else {
          s.duplicateSlides(targets);
        }
        return;
      }
      if (mod && key === "a") {
        e.preventDefault();
        s.selectSlides(s.deck.slides.map((sl) => sl.id));
        return;
      }

      if (e.key === "Escape") {
        if (s.selectedElementIds.length) s.selectElements([]);
        else if (s.selectedIds.length > 1 && s.selectedId) s.selectSlides([s.selectedId]);
        return;
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (s.selectedElementIds.length && s.selectedId) {
          s.removeElements(s.selectedId, s.selectedElementIds);
        } else {
          s.deleteSlides(targets);
        }
        return;
      }

      // Arrow keys: nudge canvas elements, or step through slides.
      if (e.key.startsWith("Arrow")) {
        const step = e.shiftKey ? 10 : 1;
        if (s.selectedElementIds.length && s.selectedId) {
          e.preventDefault();
          const slide = s.deck.slides.find((sl) => sl.id === s.selectedId);
          const dx = e.key === "ArrowLeft" ? -step : e.key === "ArrowRight" ? step : 0;
          const dy = e.key === "ArrowUp" ? -step : e.key === "ArrowDown" ? step : 0;
          const geo: Record<string, { x: number; y: number }> = {};
          for (const id of s.selectedElementIds) {
            const el = slide?.elements?.find((x) => x.id === id);
            if (el) geo[id] = { x: el.x + dx, y: el.y + dy };
          }
          s.commitGeometry(s.selectedId, geo);
          return;
        }
        if (e.key === "ArrowUp" || e.key === "ArrowDown") {
          e.preventDefault();
          const i = s.deck.slides.findIndex((sl) => sl.id === s.selectedId);
          const next = s.deck.slides[i + (e.key === "ArrowDown" ? 1 : -1)];
          if (next) s.select(next.id);
        }
        return;
      }

      if (key === "n") {
        e.preventDefault();
        onBrowseTemplates();
      }
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onBrowseTemplates]);
}
