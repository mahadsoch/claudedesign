"use client";

import { create } from "zustand";
import type { Deck, Slide, FieldValue, SlideElement, Background } from "@/lib/model/deck";
import { uid, emptyDeck } from "@/lib/model/deck";
import { getTemplate } from "@/components/templates/registry";
import { seedDeck } from "@/lib/model/seed";
import {
  putDeck,
  getDeck,
  getAllDecks,
  deleteDeck as dbDeleteDeck,
  getLegacyDeck,
  deleteLegacyDeck,
} from "@/lib/persistence/db";
import { expandGeneric } from "@/components/templates/_shared/expand";
import { useUI } from "./uiStore";

/** Lightweight deck summary for the library list. */
export interface DeckSummary {
  id: string;
  title: string;
  updatedAt: string;
  slideCount: number;
}

const ACTIVE_KEY = "bdb.activeDeckId";
function readActiveId(): string | null {
  try {
    return localStorage.getItem(ACTIVE_KEY);
  } catch {
    return null;
  }
}
function writeActiveId(id: string) {
  try {
    localStorage.setItem(ACTIVE_KEY, id);
  } catch {
    /* ignore */
  }
}
function summarize(d: Deck): DeckSummary {
  return { id: d.id, title: d.meta.title, updatedAt: d.meta.updatedAt, slideCount: d.slides.length };
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSave(deck: Deck) {
  if (saveTimer) clearTimeout(saveTimer);
  // Surface progress in the topbar. This writes to a *separate* store, so it
  // never feeds back into deck history or autosave. Autosave targets the deck's
  // own id, so it always follows whichever deck is active.
  useUI.getState().setSaveStatus("saving");
  saveTimer = setTimeout(() => {
    putDeck({ ...deck, meta: { ...deck.meta, updatedAt: new Date().toISOString() } })
      .then(() => {
        useUI.getState().setSaveStatus("saved");
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => useUI.getState().setSaveStatus("idle"), 1600);
      })
      .catch(() => {
        // Previously swallowed silently — now the user sees it failed.
        useUI.getState().setSaveStatus("error");
      });
  }, 400);
}

interface DeckState {
  deck: Deck;
  selectedId: string | null;
  imageVersion: number; // bumped when async image URLs warm, to force re-render
  hydrated: boolean;

  // ── Multi-deck library ─────────────────────────────────────────────────
  activeDeckId: string | null;
  deckList: DeckSummary[];
  refreshDecks: () => Promise<void>;
  newDeck: () => void;
  openDeck: (id: string) => Promise<void>;
  duplicateDeck: (id: string) => Promise<void>;
  removeDeck: (id: string) => Promise<void>;
  renameDeck: (id: string, title: string) => Promise<void>;

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
  moveSlideTo: (id: string, index: number) => void;
  setSlideBackground: (id: string, background: Background) => void;

  setNotes: (slideId: string, notes: string) => void;
  setField: (slideId: string, key: string, value: FieldValue) => void;
  appendSlides: (slides: Slide[]) => void;
  replaceSlideFields: (slideId: string, fields: Record<string, FieldValue>) => void;
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
    activeDeckId: null,
    deckList: [],
    past: [],
    future: [],
    _coalesceKey: null,
    _coalesceTs: 0,

    hydrate: async () => {
      try {
        // Migrate the legacy v1 single-deck record (stored under "current") into
        // a keyed record. Non-destructive + idempotent: only delete the legacy
        // record after the keyed copy is written.
        const legacy = await getLegacyDeck();
        if (legacy) {
          const migrated: Deck =
            legacy.id && legacy.id !== "current" ? legacy : { ...legacy, id: uid("deck") };
          await putDeck(migrated);
          await deleteLegacyDeck();
        }

        let records = await getAllDecks();
        if (records.length === 0) {
          const deck = seedDeck();
          await putDeck(deck);
          records = [deck];
        }

        const wantedId = readActiveId();
        const deck =
          records.find((d) => d.id === wantedId) ??
          [...records].sort((a, b) => (b.meta.updatedAt > a.meta.updatedAt ? 1 : -1))[0];

        writeActiveId(deck.id);
        set({
          deck,
          activeDeckId: deck.id,
          deckList: records.map(summarize),
          selectedId: deck.slides[0]?.id ?? null,
          hydrated: true,
          past: [],
          future: [],
        });
      } catch {
        const deck = seedDeck();
        set({
          deck,
          activeDeckId: deck.id,
          deckList: [summarize(deck)],
          selectedId: deck.slides[0]?.id ?? null,
          hydrated: true,
          past: [],
          future: [],
        });
      }
    },

    refreshDecks: async () => {
      try {
        const records = await getAllDecks();
        set({ deckList: records.map(summarize) });
      } catch {
        /* ignore */
      }
    },

    newDeck: () => {
      // A fresh deck with a single title slide — a clean, editable starting point
      // (as opposed to a bare empty stage).
      const base = emptyDeck("Untitled deck");
      const tpl = getTemplate("title-hero");
      const deck: Deck = tpl
        ? {
            ...base,
            slides: [
              { id: uid("sl"), template: tpl.id, background: tpl.background, fields: tpl.defaults() },
            ],
          }
        : base;
      writeActiveId(deck.id);
      scheduleSave(deck);
      set((s) => ({
        deck,
        activeDeckId: deck.id,
        selectedId: deck.slides[0]?.id ?? null,
        deckList: [...s.deckList.filter((x) => x.id !== deck.id), summarize(deck)],
        past: [],
        future: [],
        _coalesceKey: null,
      }));
    },

    openDeck: async (id) => {
      if (id === get().activeDeckId) return;
      const rec = await getDeck(id);
      if (!rec) return;
      writeActiveId(rec.id);
      // Clear history so undo/redo never crosses deck boundaries.
      set({
        deck: rec,
        activeDeckId: rec.id,
        selectedId: rec.slides[0]?.id ?? null,
        past: [],
        future: [],
        _coalesceKey: null,
      });
    },

    duplicateDeck: async (id) => {
      const src = id === get().activeDeckId ? get().deck : await getDeck(id);
      if (!src) return;
      const now = new Date().toISOString();
      const copy: Deck = {
        ...structuredClone(src),
        id: uid("deck"),
        meta: { ...src.meta, title: `${src.meta.title} (copy)`, createdAt: now, updatedAt: now },
      };
      await putDeck(copy);
      await get().refreshDecks();
    },

    removeDeck: async (id) => {
      await dbDeleteDeck(id);
      let records = await getAllDecks();
      if (records.length === 0) {
        // Never leave the app with zero decks.
        const fresh = seedDeck();
        await putDeck(fresh);
        records = [fresh];
      }
      const state = get();
      if (id === state.activeDeckId) {
        const next = [...records].sort((a, b) => (b.meta.updatedAt > a.meta.updatedAt ? 1 : -1))[0];
        writeActiveId(next.id);
        set({
          deck: next,
          activeDeckId: next.id,
          selectedId: next.slides[0]?.id ?? null,
          deckList: records.map(summarize),
          past: [],
          future: [],
          _coalesceKey: null,
        });
      } else {
        set({ deckList: records.map(summarize) });
      }
    },

    renameDeck: async (id, title) => {
      if (id === get().activeDeckId) {
        // Route through the normal mutation so it autosaves + is undoable.
        get().setDeckTitle(title);
        await get().refreshDecks();
        return;
      }
      const rec = await getDeck(id);
      if (!rec) return;
      await putDeck({ ...rec, meta: { ...rec.meta, title, updatedAt: new Date().toISOString() } });
      await get().refreshDecks();
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

    // Reorder by dropping a slide at an absolute index (drag-to-reorder in the
    // rail). One commit → one undo step, regardless of how far it moved.
    moveSlideTo: (id, index) => {
      const { deck } = get();
      const from = deck.slides.findIndex((s) => s.id === id);
      if (from < 0) return;
      const clamped = Math.max(0, Math.min(index, deck.slides.length - 1));
      if (clamped === from) return;
      const slides = [...deck.slides];
      const [moved] = slides.splice(from, 1);
      slides.splice(clamped, 0, moved);
      withDeck((d) => ({ ...d, slides }));
    },

    setSlideBackground: (id, background) =>
      withDeck((d) => mapSlides(d, id, (sl) => ({ ...sl, background }))),

    setNotes: (slideId, notes) =>
      withDeck((d) => mapSlides(d, slideId, (sl) => ({ ...sl, notes })), `notes:${slideId}`),

    // Append AI-generated slides after the current selection (or at the end),
    // re-id'd so they never collide with existing slide ids.
    appendSlides: (slides) => {
      if (!slides.length) return;
      const fresh = slides.map((sl) => ({ ...sl, id: uid("sl") }));
      const { selectedId, deck } = get();
      const idx = deck.slides.findIndex((s) => s.id === selectedId);
      const at = idx >= 0 ? idx + 1 : deck.slides.length;
      withDeck((d) => ({ ...d, slides: [...d.slides.slice(0, at), ...fresh, ...d.slides.slice(at)] }));
      set({ selectedId: fresh[0].id });
    },

    // Replace one slide's fields (AI rewrite), keeping its template, id, and
    // background. If the slide was detached to canvas, drop the freeform
    // overrides so the new content shows.
    replaceSlideFields: (slideId, fields) =>
      withDeck((d) =>
        mapSlides(d, slideId, (sl) => {
          const next = { ...sl, fields };
          delete next.elements;
          return next;
        })
      ),

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
      // Prefer a hand-authored expand(); otherwise fall back to a generic layout
      // so every template can be detached, not just the few with expand().
      const elements = tpl.expand
        ? tpl.expand(slide.fields, { resolveImage: (r) => r })
        : expandGeneric(tpl, slide.fields, slide.background);
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
    replaceDeck: (incoming) =>
      set((s) => {
        // Keep the active deck's id so a replace (AI generate, import, apply
        // template) updates the current library entry in place rather than
        // spawning an orphan record.
        const deck: Deck = { ...incoming, id: s.activeDeckId ?? incoming.id };
        writeActiveId(deck.id);
        scheduleSave(deck);
        return {
          deck,
          activeDeckId: deck.id,
          selectedId: deck.slides[0]?.id ?? null,
          past: [...s.past, s.deck].slice(-HISTORY_CAP),
          future: [],
          _coalesceKey: null,
          deckList: [...s.deckList.filter((x) => x.id !== deck.id), summarize(deck)],
        };
      }),
  };
});
