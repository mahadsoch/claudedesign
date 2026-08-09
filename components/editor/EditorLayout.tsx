"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useDeck } from "@/lib/state/deckStore";
import type { BaseRenderCtx } from "@/components/templates/types";
import { resolveImageSync, resolveImageAsync } from "@/lib/persistence/imageStore";
import { exportDeckJson, importDeckJson } from "@/lib/persistence/transfer";
import { exportDeckPdf } from "@/lib/pdf/exportPdf";
import { exportDeckPptx } from "@/lib/pptx/exportPptx";
import { downloadBrandFonts } from "@/lib/pptx/exportFonts";
import { SlidePalette } from "./SlidePalette";
import { PreviewStage } from "./PreviewStage";
import { Inspector } from "./Inspector";
import { GenerateModal } from "./GenerateModal";
import { TemplateGallery } from "./TemplateGallery";

export function EditorLayout() {
  const deck = useDeck((s) => s.deck);
  const selectedId = useDeck((s) => s.selectedId);
  const hydrated = useDeck((s) => s.hydrated);
  const imageVersion = useDeck((s) => s.imageVersion);
  const hydrate = useDeck((s) => s.hydrate);
  const setDeckTitle = useDeck((s) => s.setDeckTitle);
  const bumpImages = useDeck((s) => s.bumpImages);
  const replaceDeck = useDeck((s) => s.replaceDeck);
  const addSlide = useDeck((s) => s.addSlide);
  const undo = useDeck((s) => s.undo);
  const redo = useDeck((s) => s.redo);
  const canUndo = useDeck((s) => s.past.length > 0);
  const canRedo = useDeck((s) => s.future.length > 0);

  const [pdfBusy, setPdfBusy] = useState(false);
  const [pptxBusy, setPptxBusy] = useState(false);
  const [pptxFlatten, setPptxFlatten] = useState(false);
  const [fontsBusy, setFontsBusy] = useState(false);
  const [showGenerate, setShowGenerate] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  // Global undo/redo shortcuts (ignore while typing in a field).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key.toLowerCase() !== "z") return;
      const el = document.activeElement;
      const typing = el && (el.tagName === "INPUT" || el.tagName === "TEXTAREA");
      if (typing) return; // let the field handle its own undo
      e.preventDefault();
      if (e.shiftKey) redo();
      else undo();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo]);

  // Warm object URLs for any blob image refs, then force a re-render.
  useEffect(() => {
    let cancelled = false;
    const refs = new Set<string>();
    deck.slides.forEach((sl) => {
      Object.values(sl.fields).forEach((v) => {
        if (typeof v === "string" && v.startsWith("blob:")) refs.add(v);
      });
      sl.elements?.forEach((el) => {
        if (el.type === "image" && typeof el.content === "string" && el.content.startsWith("blob:")) {
          refs.add(el.content);
        }
      });
    });
    const missing = [...refs].filter((r) => !resolveImageSync(r));
    if (missing.length === 0) return;
    Promise.all(missing.map((r) => resolveImageAsync(r))).then(() => {
      if (!cancelled) bumpImages();
    });
    return () => {
      cancelled = true;
    };
  }, [deck.slides, bumpImages]);

  const ctx: BaseRenderCtx = useMemo(
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

  async function onExportPptx() {
    setPptxBusy(true);
    try {
      await exportDeckPptx(deck, { flatten: pptxFlatten });
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setPptxBusy(false);
    }
  }

  async function onDownloadFonts() {
    setFontsBusy(true);
    try {
      await downloadBrandFonts();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setFontsBusy(false);
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
        <button className="btn" title="Undo (⌘Z)" onClick={undo} disabled={!canUndo} style={{ padding: "9px 11px" }}>
          ↺
        </button>
        <button className="btn" title="Redo (⇧⌘Z)" onClick={redo} disabled={!canRedo} style={{ padding: "9px 11px" }}>
          ↻
        </button>
        <div className="spacer" />
        <button className="btn" onClick={() => setShowTemplates(true)}>
          ▦ Templates
        </button>
        <button className="btn primary" onClick={() => setShowGenerate(true)}>
          ✦ Generate with AI
        </button>
        <button className="btn" onClick={() => importRef.current?.click()}>
          Import JSON
        </button>
        <button className="btn" onClick={() => exportDeckJson(deck)}>
          Export JSON
        </button>
        <button className="btn primary" onClick={onExportPdf} disabled={pdfBusy}>
          {pdfBusy ? "Rendering…" : "Download PDF"}
        </button>
        <label
          className="btn"
          title="Export each slide as one flat image instead of editable objects. Pixel-perfect, but nothing can be edited in PowerPoint — use only if a slide exports wrong."
          style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}
        >
          <input type="checkbox" checked={pptxFlatten} onChange={(e) => setPptxFlatten(e.target.checked)} />
          Flat
        </label>
        <button className="btn primary" onClick={onExportPptx} disabled={pptxBusy}>
          {pptxBusy ? "Building…" : "Download PPTX"}
        </button>
        <button
          className="btn"
          title="Download the brand fonts (.ttf) to install. The PPTX already embeds them — only needed for Mac PowerPoint or Google Slides, which ignore embedded fonts."
          onClick={onDownloadFonts}
          disabled={fontsBusy}
        >
          {fontsBusy ? "Zipping…" : "Fonts"}
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

      <SlidePalette ctx={ctx} onBrowse={() => setShowTemplates(true)} />
      {current ? (
        <PreviewStage
          slide={current}
          ctx={ctx}
          slideNumber={deck.slides.findIndex((s) => s.id === current.id) + 1}
          slideCount={deck.slides.length}
        />
      ) : (
        <div className="stage-wrap" />
      )}
      <Inspector />

      {showGenerate && (
        <GenerateModal onClose={() => setShowGenerate(false)} onGenerated={(d) => replaceDeck(d)} />
      )}

      {showTemplates && (
        <TemplateGallery
          ctx={ctx}
          onClose={() => setShowTemplates(false)}
          onInsert={(id) => {
            addSlide(id);
            setShowTemplates(false);
          }}
          onUseDeck={(d) => {
            if (
              deck.slides.length > 0 &&
              !confirm("Replace the current deck with this template? Your current slides will be cleared.")
            ) {
              return;
            }
            replaceDeck(d);
            setShowTemplates(false);
          }}
        />
      )}
    </div>
  );
}
