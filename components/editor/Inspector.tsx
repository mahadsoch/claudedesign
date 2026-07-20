"use client";

import { useRef } from "react";
import { useDeck } from "@/lib/state/deckStore";
import { getTemplate } from "@/components/templates/registry";
import type { FieldDef } from "@/components/templates/types";
import { storeUpload, resolveImageSync } from "@/lib/persistence/imageStore";

export function Inspector() {
  const deck = useDeck((s) => s.deck);
  const selectedId = useDeck((s) => s.selectedId);
  const slide = deck.slides.find((s) => s.id === selectedId);
  const del = useDeck((s) => s.deleteSlide);
  const dup = useDeck((s) => s.duplicateSlide);
  const move = useDeck((s) => s.moveSlide);
  const detach = useDeck((s) => s.detachSlide);

  if (!slide) return <div className="inspector" />;
  const tpl = getTemplate(slide.template);
  const idx = deck.slides.findIndex((s) => s.id === slide.id);
  const detached = !!(slide.elements && slide.elements.length > 0);

  return (
    <div className="inspector">
      <div className="section-label">{tpl?.name ?? slide.template}</div>

      <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
        <button className="icon-btn" title="Move up" disabled={idx === 0} onClick={() => move(slide.id, -1)}>
          ↑
        </button>
        <button className="icon-btn" title="Move down" disabled={idx === deck.slides.length - 1} onClick={() => move(slide.id, 1)}>
          ↓
        </button>
        <button className="icon-btn" title="Duplicate" onClick={() => dup(slide.id)}>
          ⧉
        </button>
        <button className="icon-btn" title="Delete" disabled={deck.slides.length <= 1} onClick={() => del(slide.id)}>
          🗑
        </button>
      </div>

      {detached ? (
        <div style={{ font: "400 13px/1.6 var(--font-body)", color: "#9a9a9a" }}>
          This slide is on the <b style={{ color: "#ddd" }}>freeform canvas</b>. Edit elements
          directly on the stage — move, resize, restyle, add text/shapes/images. Use the toolbar
          above the canvas. <br />
          <br />
          &ldquo;Reset to template&rdquo; (in the canvas toolbar) discards freeform edits and
          restores the structured fields.
        </div>
      ) : (
        <>
          {tpl?.expand && (
            <button
              className="btn"
              style={{ width: "100%", marginBottom: 16 }}
              onClick={() => detach(slide.id)}
            >
              ✎ Detach to canvas (freeform)
            </button>
          )}
          {tpl?.fields.map((f) => (
            <Field key={f.key} slideId={slide.id} def={f} />
          ))}
        </>
      )}
    </div>
  );
}

function Field({ slideId, def }: { slideId: string; def: FieldDef }) {
  const value = useDeck((s) => s.deck.slides.find((sl) => sl.id === slideId)?.fields[def.key]);
  const setField = useDeck((s) => s.setField);

  if (def.type === "list") return <ListField slideId={slideId} def={def} />;
  if (def.type === "image") return <ImageField slideId={slideId} def={def} />;

  const v = typeof value === "string" ? value : "";
  const common = {
    value: v,
    maxLength: def.maxLength,
    placeholder: def.placeholder,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setField(slideId, def.key, e.target.value),
  };

  return (
    <div className="field">
      <label>{def.label}</label>
      {def.type === "textarea" ? <textarea rows={2} {...common} /> : <input type="text" {...common} />}
      {def.hint && <div className="hint">{def.hint}</div>}
    </div>
  );
}

function ImageField({ slideId, def }: { slideId: string; def: FieldDef }) {
  const value = useDeck((s) => s.deck.slides.find((sl) => sl.id === slideId)?.fields[def.key]);
  const setField = useDeck((s) => s.setField);
  const bump = useDeck((s) => s.bumpImages);
  const inputRef = useRef<HTMLInputElement>(null);
  const ref = typeof value === "string" ? value : "";
  const src = resolveImageSync(ref);

  return (
    <div className="field">
      <label>{def.label}</label>
      <div className="img-drop" onClick={() => inputRef.current?.click()}>
        {src ? <img src={src} alt="" /> : <span>Click to upload</span>}
      </div>
      {ref && (
        <button className="icon-btn" style={{ marginTop: 4 }} onClick={() => setField(slideId, def.key, "")}>
          Remove image
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const stored = await storeUpload(file);
          setField(slideId, def.key, stored);
          bump();
        }}
      />
    </div>
  );
}

function ListField({ slideId, def }: { slideId: string; def: FieldDef }) {
  const list = useDeck(
    (s) => (s.deck.slides.find((sl) => sl.id === slideId)?.fields[def.key] as Record<string, string>[]) ?? []
  );
  const setItem = useDeck((s) => s.setListItem);
  const addItem = useDeck((s) => s.addListItem);
  const removeItem = useDeck((s) => s.removeListItem);
  const atMax = def.maxItems != null && list.length >= def.maxItems;

  return (
    <div className="field">
      <label>{def.label}</label>
      {list.map((item, i) => (
        <div key={i} className="list-item">
          <div className="row-head">
            <span>
              {(def.itemLabel ?? "Item")} {i + 1}
            </span>
            <button className="icon-btn" onClick={() => removeItem(slideId, def.key, i)}>
              ✕
            </button>
          </div>
          {def.itemFields?.map((sub) => (
            <div key={sub.key} className="field" style={{ marginBottom: 8 }}>
              <label style={{ fontSize: 10, color: "#7a7a7a" }}>{sub.label}</label>
              {sub.type === "textarea" ? (
                <textarea
                  rows={2}
                  value={item[sub.key] ?? ""}
                  maxLength={sub.maxLength}
                  onChange={(e) => setItem(slideId, def.key, i, sub.key, e.target.value)}
                />
              ) : (
                <input
                  type="text"
                  value={item[sub.key] ?? ""}
                  maxLength={sub.maxLength}
                  placeholder={sub.placeholder}
                  onChange={(e) => setItem(slideId, def.key, i, sub.key, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      ))}
      {!atMax && (
        <button className="btn" style={{ width: "100%" }} onClick={() => addItem(slideId, def.key)}>
          + Add {def.itemLabel ?? "item"}
        </button>
      )}
    </div>
  );
}
