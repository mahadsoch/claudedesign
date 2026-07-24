"use client";

import { useUI } from "@/lib/state/uiStore";

// A small, unobtrusive indicator of autosave state. Reads the separate UI store
// (the deck store's scheduleSave writes it), so it reflects real save progress —
// including failures, which used to be swallowed silently.
export function SaveStatusPill() {
  const status = useUI((s) => s.saveStatus);
  if (status === "idle") return null;

  const map = {
    saving: { label: "Saving…", color: "#9a9a9a", dot: "#9a9a9a" },
    saved: { label: "All changes saved", color: "#8a8a8a", dot: "#4ea86b" },
    error: { label: "Save failed — changes not stored", color: "#ff8a80", dot: "#ff8a80" },
  } as const;
  const s = map[status];

  return (
    <span
      title={
        status === "error"
          ? "Your browser could not save this deck (storage full or blocked). Export to JSON to be safe."
          : undefined
      }
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        font: "500 11px var(--font-mono)",
        letterSpacing: 0.3,
        color: s.color,
        padding: "0 4px",
        whiteSpace: "nowrap",
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.dot, display: "inline-block" }} />
      {s.label}
    </span>
  );
}
