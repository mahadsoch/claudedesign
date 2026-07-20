import { openDB, type IDBPDatabase } from "idb";
import type { Deck } from "@/lib/model/deck";

// IndexedDB (not localStorage) so image blobs don't blow the ~5MB quota.
// Two stores: `decks` (keyed by deck id / "current") and `images` (blobs).

const DB_NAME = "brand-deck-builder";
const DB_VERSION = 1;

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

const CURRENT = "current";

export async function saveDeck(deck: Deck): Promise<void> {
  (await db()).put("decks", deck, CURRENT);
}

export async function loadDeck(): Promise<Deck | undefined> {
  return (await db()).get("decks", CURRENT);
}

export async function putImage(key: string, blob: Blob): Promise<void> {
  (await db()).put("images", blob, key);
}

export async function getImage(key: string): Promise<Blob | undefined> {
  return (await db()).get("images", key);
}

export async function getAllImageKeys(): Promise<string[]> {
  return (await db()).getAllKeys("images") as Promise<string[]>;
}
