"use client";

import { useState } from "react";
import type { Deck } from "@/lib/model/deck";
import { useDeck } from "@/lib/state/deckStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";

export function GenerateModal({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: (deck: Deck) => void;
}) {
  const [brief, setBrief] = useState("");
  const [count, setCount] = useState(8);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const existingSlides = useDeck((s) => s.deck.slides.length);
  const confirm = useConfirm();

  async function generate() {
    if (!brief.trim()) return;
    // Generating replaces the whole deck — confirm before spending ~30s on it,
    // not after, so the user never loses work to a surprise replace.
    if (existingSlides > 0) {
      const ok = await confirm({
        title: "Replace your current deck?",
        body: `Generating will replace all ${existingSlides} current slide${existingSlides === 1 ? "" : "s"} with a fresh AI draft. You can undo this afterward.`,
        confirmLabel: "Generate & replace",
        danger: true,
      });
      if (!ok) return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief, slideCount: count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Generation failed");
      onGenerated(data.deck as Deck);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          Generate a deck with <b style={{ color: "var(--coral)" }}>AI</b>
        </div>
        <p className="modal-sub">
          Describe the deck. Claude drafts on-brand slides from your templates — then tweak anything.
        </p>
        <textarea
          autoFocus
          rows={5}
          placeholder="e.g. A pitch for our AI workflow audit service, for ops leaders at 20–50 person SaaS companies. Cover the problem, our 2×2 framework, results, and a call to book an audit."
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          style={{
            width: "100%",
            background: "#1e1e1e",
            border: "1px solid #383838",
            borderRadius: 8,
            color: "#f0f0f0",
            font: "400 14px/1.5 var(--font-body)",
            padding: 12,
            resize: "vertical",
          }}
        />
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 14 }}>
          <label style={{ font: "500 12px var(--font-mono)", color: "#9a9a9a", letterSpacing: 0.5 }}>
            SLIDES
          </label>
          <input
            type="number"
            min={3}
            max={20}
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            style={{ width: 64, background: "#1e1e1e", border: "1px solid #383838", borderRadius: 7, color: "#f0f0f0", font: "400 13px var(--font-body)", padding: "7px 9px" }}
          />
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn primary" onClick={generate} disabled={busy || !brief.trim()}>
            {busy ? "Generating…" : "Generate"}
          </button>
        </div>
        {busy && (
          <div style={{ marginTop: 12, color: "#9a9a9a", font: "400 12px/1.4 var(--font-body)" }}>
            Planning the narrative, then writing on-brand copy for each slide — this usually takes
            20–40 seconds.
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, color: "#ff8a80", font: "400 12px/1.4 var(--font-body)" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
