"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "bdb.onboarded.v1";

// First-run orientation. The editor always opens onto a real starter deck, so
// this is a lightweight overlay (not a blank empty state) that names the panels
// and the few non-obvious conventions, then gets out of the way for good.
export function Onboarding({
  onGenerate,
  onBrowseTemplates,
}: {
  onGenerate: () => void;
  onBrowseTemplates: () => void;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setShow(true);
    } catch {
      // localStorage blocked — just don't show it.
    }
  }, []);

  function dismiss() {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="modal-backdrop" onClick={dismiss}>
      <div className="modal" style={{ width: 600 }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">
          Welcome to Brand Deck <b style={{ color: "var(--coral)" }}>Builder</b>
        </div>
        <p className="modal-sub">
          You&rsquo;re looking at a starter deck so you have something real to edit. Everything you
          do autosaves to this browser.
        </p>

        <ul style={{ listStyle: "none", display: "grid", gap: 12, margin: "4px 0 22px" }}>
          <Tip label="Slides rail (left)">
            Click a thumbnail to select it. Drag thumbnails to reorder.
          </Tip>
          <Tip label="Inspector (right)">
            Edit the selected slide&rsquo;s text and images. Move, duplicate, or delete it from the
            row of buttons at the top.
          </Tip>
          <Tip label="Coral accent">
            Wrap one word of a title in <code style={codeStyle}>[[double brackets]]</code> to paint
            it coral.
          </Tip>
          <Tip label="Detach to canvas">
            Need to go off-template? Detach a slide to drag, resize, and restyle every element
            freely.
          </Tip>
        </ul>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", flexWrap: "wrap" }}>
          <button
            className="btn"
            onClick={() => {
              dismiss();
              onBrowseTemplates();
            }}
          >
            ▦ Browse templates
          </button>
          <button
            className="btn"
            onClick={() => {
              dismiss();
              onGenerate();
            }}
          >
            ✦ Generate with AI
          </button>
          <button className="btn primary" onClick={dismiss}>
            Start editing
          </button>
        </div>
      </div>
    </div>
  );
}

const codeStyle: React.CSSProperties = {
  fontFamily: "var(--font-mono)",
  fontSize: 12,
  color: "var(--coral)",
  background: "#241a17",
  padding: "1px 5px",
  borderRadius: 4,
};

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
      <span
        style={{
          flex: "0 0 130px",
          font: "600 10px/1.4 var(--font-mono)",
          letterSpacing: 0.5,
          textTransform: "uppercase",
          color: "var(--coral)",
        }}
      >
        {label}
      </span>
      <span style={{ font: "400 13px/1.5 var(--font-body)", color: "#c4c4c4" }}>{children}</span>
    </li>
  );
}
