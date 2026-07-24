"use client";

import { useState } from "react";
import type { Deck, Slide } from "@/lib/model/deck";
import { useDeck } from "@/lib/state/deckStore";
import { useConfirm } from "@/components/ui/ConfirmDialog";

interface PlanResponse {
  title: string;
  beats: { intent: string; contentType: string }[];
  templateIds: string[];
}

export function GenerateModal({
  onClose,
  onGenerated,
}: {
  onClose: () => void;
  onGenerated: (deck: Deck) => void;
}) {
  const [brief, setBrief] = useState("");
  const [count, setCount] = useState(8);
  const [append, setAppend] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const existingSlides = useDeck((s) => s.deck.slides.length);
  const appendSlides = useDeck((s) => s.appendSlides);
  const confirm = useConfirm();

  async function post(payload: Record<string, unknown>) {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Generation failed");
    return data;
  }

  async function generate() {
    if (!brief.trim()) return;

    // Replacing loses current work — confirm up front (only when replacing a
    // non-empty deck). Append never destroys anything, so it skips the confirm.
    if (!append && existingSlides > 0) {
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
      // Two staged calls give real progress: plan the narrative, then write copy.
      setProgress("Planning the narrative…");
      let deck: Deck;
      try {
        const plan = (await post({
          action: "plan",
          brief,
          slideCount: count,
          append,
        })) as PlanResponse;
        setProgress(`Writing on-brand copy for ${plan.templateIds.length} slides…`);
        const filled = (await post({
          action: "fill",
          brief,
          title: plan.title,
          beats: plan.beats,
          templateIds: plan.templateIds,
        })) as { deck: Deck };
        deck = filled.deck;
      } catch {
        // Fall back to the single one-shot endpoint if the staged flow fails.
        setProgress("Generating…");
        const one = (await post({ action: "full", brief, slideCount: count, append })) as {
          deck: Deck;
        };
        deck = one.deck;
      }

      if (append) appendSlides(deck.slides as Slide[]);
      else onGenerated(deck);
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          Generate slides with <b style={{ color: "var(--coral)" }}>AI</b>
        </div>
        <p className="modal-sub">
          Describe what you need. Claude drafts on-brand slides from your templates — then tweak
          anything.
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
          {existingSlides > 0 && (
            <label
              style={{ display: "flex", alignItems: "center", gap: 7, font: "400 12px var(--font-body)", color: "#c4c4c4", cursor: "pointer" }}
              title="Add the new slides to your current deck instead of replacing it"
            >
              <input type="checkbox" checked={append} onChange={(e) => setAppend(e.target.checked)} />
              Add to current deck
            </label>
          )}
          <div style={{ flex: 1 }} />
          <button className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn primary" onClick={generate} disabled={busy || !brief.trim()}>
            {busy ? "Generating…" : append ? "Generate & add" : "Generate"}
          </button>
        </div>
        {busy && (
          <div style={{ marginTop: 12, color: "#9a9a9a", font: "400 12px/1.4 var(--font-body)" }}>
            {progress ?? "Working…"} <span style={{ color: "#6a6a6a" }}>(usually 20–40 seconds)</span>
          </div>
        )}
        {error && (
          <div style={{ marginTop: 12, color: "#ff8a80", font: "400 12px/1.4 var(--font-body)" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
