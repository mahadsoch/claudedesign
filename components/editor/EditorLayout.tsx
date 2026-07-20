"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDeck } from "@/lib/state/deckStore";
import type { RenderCtx } from "@/components/templates/types";
import { resolveImageSync, resolveImageAsync } from "@/lib/persistence/imageStore";
import { exportDeckJson, importDeckJson } from "@/lib/persistence/transfer";
import { exportDeckPdf } from "@/lib/pdf/exportPdf";
import { SlidePalette } from "./SlidePalette";
import { PreviewStage } from "./PreviewStage";
import { Inspector } from "./Inspector";

export function EditorLayout() {
  const deck = useDeck((s) => s.deck);
  const selectedId = useDeck((s) => s.selectedId);
  const hydrated = useDeck((s) => s.hydrated);
  const imageVersion = useDeck((s) => s.imageVersion);
  const hydrate = useDeck((s) => s.hydrate);
  const setDeckTitle = useDeck((s) => s.setDeckTitle);
  const bumpImages = useDeck((s) => s.bumpImages);
  const replaceDeck = useDeck((s) => s.replaceDeck);

  const [pdfBusy, setPdfBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Warm object URLs for any blob image refs, then force a re-render.
  useEffect(() => {
    let cancelled = false;
    const refs = new Set<string>();
    deck.slides.forEach((sl) =>
      Object.values(sl.fields).forEach((v) => {
        if (typeof v === "string" && v.startsWith("blob:")) refs.add(v);
      })
    );
    const missing = [...refs].filter((r) => !resolveImageSync(r));
    if (missing.length === 0) return;
    Promise.all(missing.map((r) => resolveImageAsync(r))).then(() => {
      if (!cancelled) bumpImages();
    });
    return () => {
      cancelled = true;
    };
  }, [deck.slides, bumpImages]);

  const ctx: RenderCtx = useMemo(
    () => ({ resolveImage: resolveImageSync }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [imageVersion]
  );

  const current = deck.slides.find((s) => s.id === selectedId) ?? deck.slides[0];

  async function onExportPdf() {
    setPdfBusy(true);
    try {
      await exportDeckPdf(deck);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPdfBusy(false);
    }
  }

  if (!hydrated) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", color: "#888" }}>
        Loading…
      </div>
    );
  }

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          Brand Deck <b>Builder</b>
        </div>
        <input
          className="deck-title"
          value={deck.meta.title}
          onChange={(e) => setDeckTitle(e.target.value)}
          style={{
            background: "#1e1e1e",
            border: "1px solid #333",
            borderRadius: 7,
            color: "#eee",
            font: "500 13px var(--font-body)",
            padding: "7px 10px",
            width: 260,
          }}
        />
        <div className="spacer" />
        <button className="btn" onClick={() => importRef.current?.click()}>
          Import JSON
        </button>
        <button className="btn" onClick={() => exportDeckJson(deck)}>
          Export JSON
        </button>
        <button className="btn primary" onClick={onExportPdf} disabled={pdfBusy}>
          {pdfBusy ? "Rendering…" : "Download PDF"}
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
              replaceDeck(await importDeckJson(file));
            } catch (err) {
              alert("Could not import: " + (err as Error).message);
            }
          }}
        />
      </div>

      <SlidePalette ctx={ctx} />
      {current ? <PreviewStage slide={current} ctx={ctx} /> : <div className="stage-wrap" />}
      <Inspector />
    </div>
  );
}
