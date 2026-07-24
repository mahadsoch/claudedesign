import { openDB, type IDBPDatabase } from "idb";
import type { Deck } from "@/lib/model/deck";

// IndexedDB (not localStorage) so image blobs don't blow the ~5MB quota.
// Two stores: `decks` (each deck keyed by its own id) and `images` (blobs).
//
// v1 stored a single deck under the fixed key "current". v2 keeps the same
// `decks` store but keys every deck by `deck.id`, enabling a multi-deck library.
// The legacy "current" record is migrated lazily on first load (see deckStore
// hydrate) rather than in the upgrade callback, so id assignment stays simple.

const DB_NAME = "brand-deck-builder";
const DB_VERSION = 2;

let _db: Promise<IDBPDatabase> | null = null;

function db() {
  if (typeof indexedDB === "undefined") {
    throw new Error("IndexedDB unavailable (server context)");
  }
  if (!_db) {
    _db = openDB(DB_NAME, DB_VERSION, {
      upgrade(d) {
        if (!d.objectStoreNames.contains("decks")) d.createObjectStore("decks");
        if (!d.objectStoreNames.contains("images")) d.createObjectStore("images");
      },
    });
  }
  return _db;
}

// ── Decks ────────────────────────────────────────────────────────────────────
const LEGACY_KEY = "current";

/** Persist a deck under its own id. */
export async function putDeck(deck: Deck): Promise<void> {
  (await db()).put("decks", deck, deck.id);
}

/** Load one deck by id. */
export async function getDeck(id: string): Promise<Deck | undefined> {
  return (await db()).get("decks", id);
}

/** Every deck record (values), for the library list. Decks are small (image
 *  blobs live in a separate store), so reading them all is cheap. */
export async function getAllDecks(): Promise<Deck[]> {
  return (await db()).getAll("decks") as Promise<Deck[]>;
}

export async function deleteDeck(id: string): Promise<void> {
  (await db()).delete("decks", id);
}

/** The legacy v1 single-deck record, if one exists under the old fixed key. */
export async function getLegacyDeck(): Promise<Deck | undefined> {
  return (await db()).get("decks", LEGACY_KEY);
}

export async function deleteLegacyDeck(): Promise<void> {
  (await db()).delete("decks", LEGACY_KEY);
}

// ── Images ─────────────────────────────────────────────────────────────────
export async function putImage(key: string, blob: Blob): Promise<void> {
  (await db()).put("images", blob, key);
}

export async function getImage(key: string): Promise<Blob | undefined> {
  return (await db()).get("images", key);
}

export async function getAllImageKeys(): Promise<string[]> {
  return (await db()).getAllKeys("images") as Promise<string[]>;
}
