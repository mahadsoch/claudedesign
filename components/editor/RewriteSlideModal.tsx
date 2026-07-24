"use client";

import { useState } from "react";
import type { FieldValue } from "@/lib/model/deck";
import { useDeck } from "@/lib/state/deckStore";
import { useToast } from "@/components/ui/Toast";

const PRESETS = [
  "Make it punchier and more concise",
  "Make the tone more confident",
  "Focus on business outcomes / ROI",
  "Simplify the language",
];

// Rewrites a single slide's content with AI, keeping its template fixed. Applies
// the returned fields in place via replaceSlideFields (undoable + autosaved).
export function RewriteSlideModal({
  slideId,
  template,
  currentFields,
  deckTitle,
  onClose,
}: {
  slideId: string;
  template: string;
  currentFields: Record<string, FieldValue>;
  deckTitle: string;
  onClose: () => void;
}) {
  const [instruction, setInstruction] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const replaceSlideFields = useDeck((s) => s.replaceSlideFields);
  const toast = useToast();

  async function run() {
    if (!instruction.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "slide",
          template,
          instruction,
          deckTitle,
          currentFields,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Rewrite failed");
      replaceSlideFields(slideId, data.fields as Record<string, FieldValue>);
      toast.success("Slide rewritten.");
      onClose();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" style={{ width: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          Rewrite this slide with <b style={{ color: "var(--coral)" }}>AI</b>
        </div>
        <p className="modal-sub">
          The layout stays the same — only the words change. You can undo it.
        </p>
        <textarea
          autoFocus
          rows={3}
          placeholder="e.g. Rewrite for a non-technical exec audience and lead with the cost saving."
          value={instruction}
          onChange={(e) => setInstruction(e.target.value)}
          style={{ width: "100%", background: "#1e1e1e", border: "1px solid #383838", borderRadius: 8, color: "#f0f0f0", font: "400 14px/1.5 var(--font-body)", padding: 12, resize: "vertical" }}
        />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
          {PRESETS.map((p) => (
            <button
              key={p}
              className="btn"
              style={{ padding: "5px 9px", fontSize: 11 }}
              onClick={() => setInstruction(p)}
            >
              {p}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
          <button className="btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button className="btn primary" onClick={run} disabled={busy || !instruction.trim()}>
            {busy ? "Rewriting…" : "Rewrite"}
          </button>
        </div>
        {error && (
          <div style={{ marginTop: 12, color: "#ff8a80", font: "400 12px/1.4 var(--font-body)" }}>{error}</div>
        )}
      </div>
    </div>
  );
}
