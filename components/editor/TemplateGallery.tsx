"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Deck, Slide } from "@/lib/model/deck";
import { STAGE_W, STAGE_H, uid } from "@/lib/model/deck";
import type { RenderCtx, TemplateDef } from "@/components/templates/types";
import { getTemplate } from "@/components/templates/registry";
import { SlideRenderer } from "@/components/SlideRenderer";
import { rankTemplates } from "@/lib/ai/suggestTemplates";
import { DECK_TEMPLATES } from "@/lib/model/executiveReview";

/** A live, scaled-down render of a template's default slide. */
function TemplatePreview({ template, ctx }: { template: TemplateDef; ctx: RenderCtx }) {
  const ref = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.18);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => setScale(el.clientWidth / STAGE_W);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const slide: Slide = useMemo(
    () => ({ id: uid("prev"), template: template.id, background: template.background, fields: template.defaults() }),
    [template]
  );
  return (
    <div
      ref={ref}
      style={{ position: "relative", width: "100%", aspectRatio: "16 / 9", borderRadius: 8, overflow: "hidden", background: "#000" }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, width: STAGE_W, height: STAGE_H, transformOrigin: "top left", transform: `scale(${scale})`, pointerEvents: "none" }}>
        <SlideRenderer slide={slide} ctx={ctx} />
      </div>
    </div>
  );
}

export function TemplateGallery({
  ctx,
  onClose,
  onInsert,
  onUseDeck,
}: {
  ctx: RenderCtx;
  onClose: () => void;
  onInsert: (templateId: string) => void;
  onUseDeck: (deck: Deck) => void;
}) {
  const [query, setQuery] = useState("");

  // Rank templates by the query. rankTemplates sorts by score (desc); with no
  // query every score is 0, so the stable sort preserves registry order.
  const ranked = useMemo(() => rankTemplates(query), [query]);
  const ordered = ranked.map((r) => r.template);
  const topId = query.trim() && ranked[0]?.score > 0 ? ranked[0].template.id : null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ width: "min(1120px, calc(100vw - 48px))", maxHeight: "88vh", overflowY: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div className="modal-title">Template library</div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>
        <p className="modal-sub" style={{ margin: "8px 0 16px" }}>
          Start from a full deck, or drop in a single slide. Search by what the slide is about — pricing, roadmap,
          team, results — to see the best-fit templates first.
        </p>

        <input
          autoFocus
          placeholder="Search templates — e.g. pricing, roadmap, problem, team…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{ width: "100%", background: "#1e1e1e", border: "1px solid #383838", borderRadius: 8, color: "#f0f0f0", font: "400 14px var(--font-body)", padding: "11px 13px", marginBottom: 22 }}
        />

        {!query.trim() && (
          <>
            <div className="section-label" style={{ margin: "0 0 12px" }}>Start from a deck template</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16, marginBottom: 28 }}>
              {DECK_TEMPLATES.map((d) => {
                const first = getTemplate(d.build().slides[0].template);
                return (
                  <div key={d.id} style={{ border: "1px solid #333", borderRadius: 10, overflow: "hidden", background: "#161616" }}>
                    {first && <TemplatePreview template={first} ctx={ctx} />}
                    <div style={{ padding: "14px 16px" }}>
                      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                        <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, color: "#f2f2f2" }}>{d.name}</div>
                        <span style={{ font: "500 11px var(--font-mono)", color: "#7a7a7a" }}>{d.slideCount} slides</span>
                      </div>
                      <p style={{ font: "400 12px/1.5 var(--font-body)", color: "#9a9a9a", margin: "6px 0 12px" }}>{d.description}</p>
                      <button className="btn primary" style={{ width: "100%" }} onClick={() => onUseDeck(d.build())}>
                        Use this deck
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <div className="section-label" style={{ margin: "0 0 12px" }}>
          {query.trim() ? "Best-fit slides" : "Add a single slide"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {ordered.map((t) => (
            <div key={t.id} style={{ border: t.id === topId ? "1px solid var(--coral)" : "1px solid #333", borderRadius: 10, overflow: "hidden", background: "#161616" }}>
              <TemplatePreview template={t} ctx={ctx} />
              <div style={{ padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ fontFamily: "var(--font-title)", fontWeight: 600, fontSize: 16, color: "#f2f2f2" }}>{t.name}</div>
                  {t.id === topId && (
                    <span style={{ font: "600 9px var(--font-mono)", letterSpacing: 1, color: "var(--coral)", border: "1px solid var(--coral)", borderRadius: 999, padding: "2px 7px" }}>
                      BEST MATCH
                    </span>
                  )}
                </div>
                <p style={{ font: "400 12px/1.5 var(--font-body)", color: "#9a9a9a", margin: "6px 0 12px", minHeight: 36 }}>{t.description}</p>
                <button className="btn" style={{ width: "100%" }} onClick={() => onInsert(t.id)}>
                  Insert slide
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
