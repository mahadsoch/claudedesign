"use client";

import { create } from "zustand";
import type { Deck, Slide, FieldValue } from "@/lib/model/deck";
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

  setField: (slideId: string, key: string, value: FieldValue) => void;
  setListItem: (slideId: string, key: string, index: number, itemKey: string, value: string) => void;
  addListItem: (slideId: string, key: string) => void;
  removeListItem: (slideId: string, key: string, index: number) => void;

  bumpImages: () => void;
  replaceDeck: (deck: Deck) => void;
}

const HISTORY_CAP = 50;
const COALESCE_MS = 600;

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
        set({ deck, selectedId: deck.slides[0]?.id ?? null, hydrated: true, past: [], future: [] });
        if (!saved) scheduleSave(deck);
      } catch {
        const deck = seedDeck();
        set({ deck, selectedId: deck.slides[0]?.id ?? null, hydrated: true, past: [], future: [] });
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
        };
      }),

    select: (id) => set({ selectedId: id }),
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
      set({ selectedId: slide.id });
    },

    deleteSlide: (id) => {
      const { deck } = get();
      if (deck.slides.length <= 1) return;
      const idx = deck.slides.findIndex((s) => s.id === id);
      withDeck((d) => ({ ...d, slides: d.slides.filter((s) => s.id !== id) }));
      const next = deck.slides[idx + 1] ?? deck.slides[idx - 1];
      if (next) set({ selectedId: next.id });
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
      set({ selectedId: copy.id });
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

    bumpImages: () => set((s) => ({ imageVersion: s.imageVersion + 1 })),
    replaceDeck: (deck) =>
      set((s) => {
        scheduleSave(deck);
        return {
          deck,
          selectedId: deck.slides[0]?.id ?? null,
          past: [...s.past, s.deck].slice(-HISTORY_CAP),
          future: [],
          _coalesceKey: null,
        };
      }),
  };
});
