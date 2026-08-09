"use client";

import { create } from "zustand";
import type { ReactElement } from "react";
import { expandFromDom } from "@/lib/canvas/expandFromDom";
import type { Deck, Slide, FieldValue, SlideElement, Background } from "@/lib/model/deck";
import { uid } from "@/lib/model/deck";
import { getTemplate } from "@/components/templates/registry";
import { seedDeck } from "@/lib/model/seed";
import { saveDeck, loadDeck } from "@/lib/persistence/db";

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(deck: Deck) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDeck({ ...deck, meta: { ...deck.meta, updatedAt: new Date().toISOString() } }).catch(
      () => {}
    );
  }, 400);
}

interface DeckState {
  deck: Deck;
  selectedId: string | null;
  imageVersion: number; // bumped when async image URLs warm, to force re-render
  hydrated: boolean;

  // Undo/redo: snapshot stacks. Kept outside `deck` so they never autosave.
  past: Deck[];
  future: Deck[];
  _coalesceKey: string | null;
  _coalesceTs: number;
  undo: () => void;
  redo: () => void;

  hydrate: () => Promise<void>;
  select: (id: string) => void;
  setDeckTitle: (title: string) => void;

  addSlide: (templateId: string) => void;
  deleteSlide: (id: string) => void;
  duplicateSlide: (id: string) => void;
  moveSlide: (id: string, dir: -1 | 1) => void;
  /** Drag-reorder: move the slide at `from` to index `to`. */
  reorderSlide: (from: number, to: number) => void;
  setSlideBackground: (id: string, background: Background) => void;
  /**
   * Swap a slide's layout in place, carrying over every field the new template
   * also declares. Without this, changing layout means deleting the slide and
   * retyping its content.
   */
  setSlideTemplate: (id: string, templateId: string) => void;

  // ── Multi-slide selection ───────────────────────────────────────────────
  /** Slides selected in the filmstrip. Always contains `selectedId` when set. */
  selectedIds: string[];
  selectSlides: (ids: string[]) => void;
  /** Shift/⌘-click: add or remove one slide from the selection. */
  toggleSlideSelected: (id: string) => void;
  /** Extend the selection from the active slide to `id` (shift-click a range). */
  selectSlideRange: (id: string) => void;
  deleteSlides: (ids: string[]) => void;
  duplicateSlides: (ids: string[]) => void;

  // ── Clipboard ───────────────────────────────────────────────────────────
  clipboard: Slide[];
  copySlides: (ids: string[]) => void;
  pasteSlides: () => void;

  setField: (slideId: string, key: string, value: FieldValue) => void;
  setListItem: (slideId: string, key: string, index: number, itemKey: string, value: string) => void;
  addListItem: (slideId: string, key: string) => void;
  removeListItem: (slideId: string, key: string, index: number) => void;

  bumpImages: () => void;
  replaceDeck: (deck: Deck) => void;

  // ── Freeform canvas (Phase 3) ──────────────────────────────────────────
  selectedElementIds: string[];
  editingElementId: string | null;
  selectElements: (ids: string[]) => void;
  setEditingElement: (id: string | null) => void;

  detachSlide: (slideId: string) => void;
  reattachSlide: (slideId: string) => void;
  addElement: (slideId: string, el: Omit<SlideElement, "id">) => string;
  updateElement: (slideId: string, id: string, patch: Partial<SlideElement>) => void;
  updateElementStyle: (slideId: string, id: string, style: Record<string, string | number>) => void;
  commitGeometry: (slideId: string, geo: Record<string, Partial<SlideElement>>) => void;
  removeElements: (slideId: string, ids: string[]) => void;
  duplicateElement: (slideId: string, id: string) => void;
  reorderElement: (slideId: string, id: string, op: "front" | "back" | "forward" | "backward") => void;
}

const HISTORY_CAP = 50;
const COALESCE_MS = 600;

/**
 * After stepping through history, the selection may name slides (or elements)
 * that the restored deck no longer contains — undoing a paste is the obvious
 * case. Anything that then acts on "the selection" would silently no-op, so the
 * selection is pruned back to what actually exists.
 */
function reconcileSelection(
  deck: Deck,
  s: DeckState
): Pick<DeckState, "selectedId" | "selectedIds" | "selectedElementIds" | "editingElementId"> {
  const live = new Set(deck.slides.map((sl) => sl.id));
  const ids = s.selectedIds.filter((id) => live.has(id));
  const selectedId = s.selectedId && live.has(s.selectedId) ? s.selectedId : (ids[0] ?? deck.slides[0]?.id ?? null);
  const selectedIds = ids.length ? ids : selectedId ? [selectedId] : [];
  const slide = deck.slides.find((sl) => sl.id === selectedId);
  const liveEls = new Set((slide?.elements ?? []).map((e) => e.id));
  const selectedElementIds = s.selectedElementIds.filter((id) => liveEls.has(id));
  return {
    selectedId,
    selectedIds,
    selectedElementIds,
    editingElementId:
      s.editingElementId && liveEls.has(s.editingElementId) ? s.editingElementId : null,
  };
}

// Every deck mutation flows through here, so history + autosave are automatic.
// Pass a `coalesceKey` for rapid edits (typing) so consecutive same-key changes
// within COALESCE_MS collapse into one undo step instead of one per keystroke.
function commit(set: (fn: (s: DeckState) => Partial<DeckState>) => void) {
  return (mutator: (deck: Deck) => Deck, coalesceKey?: string) =>
    set((s) => {
      const prev = s.deck;
      const deck = mutator(prev);
      if (deck === prev) return {};
      scheduleSave(deck);
      const now = Date.now();
      const coalesce =
        coalesceKey != null && s._coalesceKey === coalesceKey && now - s._coalesceTs < COALESCE_MS;
      const past = coalesce ? s.past : [...s.past, prev].slice(-HISTORY_CAP);
      return {
        deck,
        past,
        future: [],
        _coalesceKey: coalesceKey ?? null,
        _coalesceTs: now,
      };
    });
}

export const useDeck = create<DeckState>((set, get) => {
  const withDeck = commit(set);
  const mapSlides = (deck: Deck, id: string, fn: (sl: Slide) => Slide): Deck => ({
    ...deck,
    slides: deck.slides.map((sl) => (sl.id === id ? fn(sl) : sl)),
  });

  return {
    deck: seedDeck(),
    selectedId: null,
    selectedIds: [],
    clipboard: [],
    imageVersion: 0,
    hydrated: false,
    past: [],
    future: [],
    _coalesceKey: null,
    _coalesceTs: 0,

    hydrate: async () => {
      try {
        const saved = await loadDeck();
        const deck = saved && saved.slides?.length ? saved : seedDeck();
        set({ deck, selectedId: deck.slides[0]?.id ?? null, selectedIds: deck.slides[0] ? [deck.slides[0].id] : [], hydrated: true, past: [], future: [] });
        if (!saved) scheduleSave(deck);
      } catch {
        const deck = seedDeck();
        set({ deck, selectedId: deck.slides[0]?.id ?? null, selectedIds: deck.slides[0] ? [deck.slides[0].id] : [], hydrated: true, past: [], future: [] });
      }
    },

    undo: () =>
      set((s) => {
        if (s.past.length === 0) return {};
        const prev = s.past[s.past.length - 1];
        scheduleSave(prev);
        return {
          deck: prev,
          past: s.past.slice(0, -1),
          future: [s.deck, ...s.future].slice(0, HISTORY_CAP),
          _coalesceKey: null,
          ...reconcileSelection(prev, s),
        };
      }),

    redo: () =>
      set((s) => {
        if (s.future.length === 0) return {};
        const next = s.future[0];
        scheduleSave(next);
        return {
          deck: next,
          future: s.future.slice(1),
          past: [...s.past, s.deck].slice(-HISTORY_CAP),
          _coalesceKey: null,
          ...reconcileSelection(next, s),
        };
      }),

    select: (id) => set({ selectedId: id, selectedIds: [id] }),
    setDeckTitle: (title) => withDeck((d) => ({ ...d, meta: { ...d.meta, title } }), "deck-title"),

    addSlide: (templateId) => {
      const tpl = getTemplate(templateId);
      if (!tpl) return;
      const slide: Slide = {
        id: uid("sl"),
        template: templateId,
        background: tpl.background,
        fields: tpl.defaults(),
      };
      const { selectedId, deck } = get();
      const idx = deck.slides.findIndex((s) => s.id === selectedId);
      const at = idx >= 0 ? idx + 1 : deck.slides.length;
      withDeck((d) => ({
        ...d,
        slides: [...d.slides.slice(0, at), slide, ...d.slides.slice(at)],
      }));
      set({ selectedId: slide.id, selectedIds: [slide.id] });
    },

    deleteSlide: (id) => {
      const { deck } = get();
      if (deck.slides.length <= 1) return;
      const idx = deck.slides.findIndex((s) => s.id === id);
      withDeck((d) => ({ ...d, slides: d.slides.filter((s) => s.id !== id) }));
      const next = deck.slides[idx + 1] ?? deck.slides[idx - 1];
      if (next) set({ selectedId: next.id, selectedIds: [next.id] });
    },

    duplicateSlide: (id) => {
      const { deck } = get();
      const idx = deck.slides.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const copy: Slide = { ...structuredClone(deck.slides[idx]), id: uid("sl") };
      withDeck((d) => ({
        ...d,
        slides: [...d.slides.slice(0, idx + 1), copy, ...d.slides.slice(idx + 1)],
      }));
      set({ selectedId: copy.id, selectedIds: [copy.id] });
    },

    moveSlide: (id, dir) => {
      const { deck } = get();
      const idx = deck.slides.findIndex((s) => s.id === id);
      const to = idx + dir;
      if (idx < 0 || to < 0 || to >= deck.slides.length) return;
      const slides = [...deck.slides];
      [slides[idx], slides[to]] = [slides[to], slides[idx]];
      withDeck((d) => ({ ...d, slides }));
    },

    reorderSlide: (from, to) => {
      const { deck } = get();
      const n = deck.slides.length;
      if (from === to || from < 0 || from >= n || to < 0 || to >= n) return;
      withDeck((d) => {
        const slides = [...d.slides];
        const [moved] = slides.splice(from, 1);
        slides.splice(to, 0, moved);
        return { ...d, slides };
      });
    },

    setSlideBackground: (id, background) =>
      withDeck((d) => mapSlides(d, id, (sl) => ({ ...sl, background }))),

    setSlideTemplate: (id, templateId) => {
      const next = getTemplate(templateId);
      if (!next) return;
      withDeck((d) =>
        mapSlides(d, id, (sl) => {
          if (sl.template === templateId) return sl;
          const defaults = next.defaults();
          const fields: Record<string, FieldValue> = { ...defaults };
          // Carry over anything the new template also declares, by key and by
          // shape — a `title` stays a title, a list stays a list. Fields the new
          // template does not have are dropped; ones it has but the old one
          // lacked come from defaults.
          for (const def of next.fields) {
            const prev = sl.fields[def.key];
            if (prev == null) continue;
            const prevIsList = Array.isArray(prev);
            if (prevIsList !== (def.type === "list")) continue;
            fields[def.key] = prev;
          }
          const swapped: Slide = { ...sl, template: templateId, fields };
          // Freeform overrides belonged to the old layout; keeping them would
          // silently ignore the swap.
          delete swapped.elements;
          return swapped;
        })
      );
      set({ selectedElementIds: [], editingElementId: null });
    },

    selectSlides: (ids) =>
      set((s) => ({ selectedIds: ids, selectedId: ids.includes(s.selectedId ?? "") ? s.selectedId : (ids[0] ?? null) })),

    toggleSlideSelected: (id) =>
      set((s) => {
        const has = s.selectedIds.includes(id);
        const ids = has ? s.selectedIds.filter((i) => i !== id) : [...s.selectedIds, id];
        if (ids.length === 0) return { selectedIds: [id], selectedId: id };
        return { selectedIds: ids, selectedId: has ? (ids[ids.length - 1] ?? null) : id };
      }),

    selectSlideRange: (id) => {
      const { deck, selectedId } = get();
      const a = deck.slides.findIndex((s) => s.id === selectedId);
      const b = deck.slides.findIndex((s) => s.id === id);
      if (a < 0 || b < 0) return;
      const [lo, hi] = a < b ? [a, b] : [b, a];
      set({ selectedIds: deck.slides.slice(lo, hi + 1).map((s) => s.id), selectedId: id });
    },

    deleteSlides: (ids) => {
      const { deck } = get();
      const kill = new Set(ids);
      const remaining = deck.slides.filter((s) => !kill.has(s.id));
      // The deck must never be emptied — there would be no way back to a slide.
      if (remaining.length === 0) return;
      const firstIdx = deck.slides.findIndex((s) => kill.has(s.id));
      withDeck((d) => ({ ...d, slides: d.slides.filter((s) => !kill.has(s.id)) }));
      const next = remaining[Math.min(firstIdx, remaining.length - 1)];
      set({ selectedId: next?.id ?? null, selectedIds: next ? [next.id] : [] });
    },

    duplicateSlides: (ids) => {
      const { deck } = get();
      const keep = new Set(ids);
      const picked = deck.slides.filter((s) => keep.has(s.id));
      if (picked.length === 0) return;
      const copies = picked.map((s) => ({ ...structuredClone(s), id: uid("sl") }));
      const lastIdx = deck.slides.reduce((acc, s, i) => (keep.has(s.id) ? i : acc), 0);
      withDeck((d) => ({
        ...d,
        slides: [...d.slides.slice(0, lastIdx + 1), ...copies, ...d.slides.slice(lastIdx + 1)],
      }));
      set({ selectedId: copies[0].id, selectedIds: copies.map((c) => c.id) });
    },

    copySlides: (ids) => {
      const { deck } = get();
      const keep = new Set(ids);
      const picked = deck.slides.filter((s) => keep.has(s.id));
      if (picked.length) set({ clipboard: structuredClone(picked) });
    },

    pasteSlides: () => {
      const { clipboard, deck, selectedId } = get();
      if (clipboard.length === 0) return;
      const copies = clipboard.map((s) => ({ ...structuredClone(s), id: uid("sl") }));
      const idx = deck.slides.findIndex((s) => s.id === selectedId);
      const at = idx >= 0 ? idx + 1 : deck.slides.length;
      withDeck((d) => ({
        ...d,
        slides: [...d.slides.slice(0, at), ...copies, ...d.slides.slice(at)],
      }));
      set({ selectedId: copies[0].id, selectedIds: copies.map((c) => c.id) });
    },

    setField: (slideId, key, value) =>
      withDeck(
        (d) => mapSlides(d, slideId, (sl) => ({ ...sl, fields: { ...sl.fields, [key]: value } })),
        `field:${slideId}:${key}`
      ),

    setListItem: (slideId, key, index, itemKey, value) =>
      withDeck(
        (d) =>
          mapSlides(d, slideId, (sl) => {
            const list = [...((sl.fields[key] as Record<string, string>[]) ?? [])];
            list[index] = { ...list[index], [itemKey]: value };
            return { ...sl, fields: { ...sl.fields, [key]: list } };
          }),
        `list:${slideId}:${key}:${index}:${itemKey}`
      ),

    addListItem: (slideId, key) =>
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => {
          const tpl = getTemplate(sl.template);
          const field = tpl?.fields.find((f) => f.key === key);
          const blank: Record<string, string> = {};
          field?.itemFields?.forEach((f) => (blank[f.key] = ""));
          const list = [...((sl.fields[key] as Record<string, string>[]) ?? []), blank];
          return { ...sl, fields: { ...sl.fields, [key]: list } };
        })
      ),

    removeListItem: (slideId, key, index) =>
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => {
          const list = [...((sl.fields[key] as Record<string, string>[]) ?? [])];
          list.splice(index, 1);
          return { ...sl, fields: { ...sl.fields, [key]: list } };
        })
      ),

    selectedElementIds: [],
    editingElementId: null,
    selectElements: (ids) => set({ selectedElementIds: ids }),
    setEditingElement: (id) => set({ editingElementId: id }),

    detachSlide: (slideId) => {
      const { deck } = get();
      const slide = deck.slides.find((s) => s.id === slideId);
      if (!slide || slide.elements?.length) return;
      const tpl = getTemplate(slide.template);
      if (!tpl) return;
      // Measure the real render rather than re-describing the layout, so detach
      // works for every template and can never disagree with what is on screen.
      // The identity image resolver keeps `blob:`/`icon:` refs intact.
      const idx = deck.slides.findIndex((s) => s.id === slideId);
      const node = tpl.render(slide.fields, {
        resolveImage: (r) => r,
        background: slide.background,
        slideNumber: idx + 1,
        slideCount: deck.slides.length,
      }) as ReactElement;
      const elements = expandFromDom(node);
      if (elements.length === 0) return;
      withDeck((d) => mapSlides(d, slideId, (sl) => ({ ...sl, elements })));
      set({ selectedElementIds: [] });
    },

    reattachSlide: (slideId) => {
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => {
          const copy = { ...sl };
          delete copy.elements;
          return copy;
        })
      );
      set({ selectedElementIds: [], editingElementId: null });
    },

    addElement: (slideId, el) => {
      const id = uid("el");
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => ({ ...sl, elements: [...(sl.elements ?? []), { ...el, id }] }))
      );
      set({ selectedElementIds: [id] });
      return id;
    },

    updateElement: (slideId, id, patch) =>
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => ({
          ...sl,
          elements: (sl.elements ?? []).map((e) =>
            e.id === id ? { ...e, ...patch, style: { ...e.style, ...(patch.style ?? {}) } } : e
          ),
        }))
      ),

    updateElementStyle: (slideId, id, style) =>
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => ({
          ...sl,
          elements: (sl.elements ?? []).map((e) => (e.id === id ? { ...e, style: { ...e.style, ...style } } : e)),
        }))
      ),

    commitGeometry: (slideId, geo) =>
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => ({
          ...sl,
          elements: (sl.elements ?? []).map((e) => (geo[e.id] ? { ...e, ...geo[e.id] } : e)),
        }))
      ),

    removeElements: (slideId, ids) => {
      const set$ = new Set(ids);
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => ({ ...sl, elements: (sl.elements ?? []).filter((e) => !set$.has(e.id)) }))
      );
      set((s) => ({ selectedElementIds: s.selectedElementIds.filter((i) => !set$.has(i)) }));
    },

    duplicateElement: (slideId, id) => {
      const newId = uid("el");
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => {
          const src = (sl.elements ?? []).find((e) => e.id === id);
          if (!src) return sl;
          const copy: SlideElement = { ...structuredClone(src), id: newId, x: src.x + 24, y: src.y + 24 };
          return { ...sl, elements: [...(sl.elements ?? []), copy] };
        })
      );
      set({ selectedElementIds: [newId] });
    },

    reorderElement: (slideId, id, op) =>
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => {
          const els = [...(sl.elements ?? [])];
          const i = els.findIndex((e) => e.id === id);
          if (i < 0) return sl;
          const [el] = els.splice(i, 1);
          if (op === "front") els.push(el);
          else if (op === "back") els.unshift(el);
          else if (op === "forward") els.splice(Math.min(i + 1, els.length), 0, el);
          else els.splice(Math.max(i - 1, 0), 0, el);
          return { ...sl, elements: els };
        })
      ),

    bumpImages: () => set((s) => ({ imageVersion: s.imageVersion + 1 })),
    replaceDeck: (deck) =>
      set((s) => {
        scheduleSave(deck);
        return {
          deck,
          selectedId: deck.slides[0]?.id ?? null,
          selectedIds: deck.slides[0] ? [deck.slides[0].id] : [],
          past: [...s.past, s.deck].slice(-HISTORY_CAP),
          future: [],
          _coalesceKey: null,
        };
      }),
  };
});
