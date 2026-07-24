"use client";

import { create } from "zustand";

// Transient, non-persisted UI state. Deliberately separate from the deck store
// so nothing here ever lands in undo history or triggers an autosave. The deck
// store's `scheduleSave` reaches in here to surface save progress.

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface UIState {
  saveStatus: SaveStatus;
  setSaveStatus: (s: SaveStatus) => void;

  // Presentation mode (Phase 3). Lives here, not on the deck, so presenting
  // never mutates or autosaves the deck.
  presenting: boolean;
  presentIndex: number;
  startPresenting: (index: number) => void;
  stopPresenting: () => void;
  setPresentIndex: (index: number) => void;
}

export const useUI = create<UIState>((set) => ({
  saveStatus: "idle",
  setSaveStatus: (saveStatus) => set({ saveStatus }),

  presenting: false,
  presentIndex: 0,
  startPresenting: (presentIndex) => set({ presenting: true, presentIndex }),
  stopPresenting: () => set({ presenting: false }),
  setPresentIndex: (presentIndex) => set({ presentIndex }),
}));
