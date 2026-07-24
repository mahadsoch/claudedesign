"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { Deck } from "@/lib/model/deck";
import type { RenderCtx } from "@/components/templates/types";
import { useDeck, type DeckSummary } from "@/lib/state/deckStore";
import { getDeck } from "@/lib/persistence/db";
import { SlideRenderer } from "@/components/SlideRenderer";
import { useConfirm } from "@/components/ui/ConfirmDialog";

// A scaled live preview of a deck's first slide.
function DeckCover({ deckId, ctx }: { deckId: string; ctx: RenderCtx }) {
  const activeDeck = useDeck((s) => s.deck);
  const [deck, setDeck] = useState<Deck | null>(activeDeck.id === deckId ? activeDeck : null);
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);

  useEffect(() => {
    if (activeDeck.id === deckId) {
      setDeck(activeDeck);
    } else {
      let ok = true;
      getDeck(deckId).then((d) => ok && d && setDeck(d));
      return () => {
        ok = false;
      };
    }
  }, [deckId, activeDeck]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / STAGE_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const first = deck?.slides[0];
  return (
    <div
      ref={ref}
      style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", background: "#000" }}
    >
      {first && (
        <div style={{ position: "absolute", top: 0, left: 0, width: STAGE_W, height: STAGE_H, transformOrigin: "top left", transform: `scale(${scale})`, pointerEvents: "none" }}>
          <SlideRenderer slide={first} ctx={ctx} />
        </div>
      )}
    </div>
  );
}

function DeckCard({
  summary,
  active,
  ctx,
  onOpen,
  onDuplicate,
  onDelete,
  onRename,
}: {
  summary: DeckSummary;
  active: boolean;
  ctx: RenderCtx;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onRename: (title: string) => void;
}) {
  const [title, setTitle] = useState(summary.title);
  useEffect(() => setTitle(summary.title), [summary.title]);

  const updated = useMemo(() => {
    try {
      return new Date(summary.updatedAt).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return "";
    }
  }, [summary.updatedAt]);

  return (
    <div style={{ border: active ? "1px solid var(--coral)" : "1px solid #333", borderRadius: 10, overflow: "hidden", background: "#161616" }}>
      <div style={{ cursor: "pointer" }} onClick={onOpen}>
        <DeckCover deckId={summary.id} ctx={ctx} />
      </div>
      <div style={{ padding: "12px 14px" }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== summary.title && onRename(title.trim())}
          onKeyDown={(e) => {
            if (e.key === "Enter") (e.target as HTMLInputElement).blur();
          }}
          style={{ width: "100%", background: "#1e1e1e", border: "1px solid #333", borderRadius: 6, color: "#f2f2f2", font: "600 14px var(--font-title)", padding: "6px 8px" }}
        />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "8px 0 12px" }}>
          <span style={{ font: "500 11px var(--font-mono)", color: "#7a7a7a" }}>
            {summary.slideCount} slide{summary.slideCount === 1 ? "" : "s"}
          </span>
          <span style={{ font: "400 11px var(--font-mono)", color: "#666" }}>{updated}</span>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="btn primary" style={{ flex: 1 }} onClick={onOpen} disabled={active}>
            {active ? "Current" : "Open"}
          </button>
          <button className="btn" onClick={onDuplicate} title="Duplicate deck">
            ⧉
          </button>
          <button className="btn" onClick={onDelete} title="Delete deck">
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

export function DeckLibrary({ ctx, onClose }: { ctx: RenderCtx; onClose: () => void }) {
  const deckList = useDeck((s) => s.deckList);
  const activeDeckId = useDeck((s) => s.activeDeckId);
  const refreshDecks = useDeck((s) => s.refreshDecks);
  const newDeck = useDeck((s) => s.newDeck);
  const openDeck = useDeck((s) => s.openDeck);
  const duplicateDeck = useDeck((s) => s.duplicateDeck);
  const removeDeck = useDeck((s) => s.removeDeck);
  const renameDeck = useDeck((s) => s.renameDeck);
  const confirm = useConfirm();

  useEffect(() => {
    refreshDecks();
  }, [refreshDecks]);

  const ordered = useMemo(
    () => [...deckList].sort((a, b) => (b.updatedAt > a.updatedAt ? 1 : -1)),
    [deckList]
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(1120px, calc(100vw - 48px))", maxHeight: "88vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="modal-title">Your decks</div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn primary"
              onClick={() => {
                newDeck();
                onClose();
              }}
            >
              + New deck
            </button>
            <button className="btn" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
        <p className="modal-sub" style={{ margin: "8px 0 18px" }}>
          Every deck is saved locally in this browser. Open one to edit, duplicate to branch, or
          rename inline.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {ordered.map((d) => (
            <DeckCard
              key={d.id}
              summary={d}
              active={d.id === activeDeckId}
              ctx={ctx}
              onOpen={async () => {
                await openDeck(d.id);
                onClose();
              }}
              onDuplicate={() => duplicateDeck(d.id)}
              onRename={(title) => renameDeck(d.id, title)}
              onDelete={async () => {
                const ok = await confirm({
                  title: "Delete this deck?",
                  body: `"${d.title}" will be permanently removed from this browser. This cannot be undone.`,
                  confirmLabel: "Delete deck",
                  danger: true,
                });
                if (ok) await removeDeck(d.id);
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
