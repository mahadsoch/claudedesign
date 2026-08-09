"use client";

import { useEffect, useRef } from "react";
import Moveable from "react-moveable";
import Selecto from "react-selecto";
import type { Slide, SlideElement } from "@/lib/model/deck";
import { STAGE_W, STAGE_H } from "@/lib/model/deck";
import type { BaseRenderCtx } from "@/components/templates/types";
import { useDeck } from "@/lib/state/deckStore";
import { Stage } from "@/components/templates/_shared/primitives";
import { elementContent } from "./renderElement";
import { SNAP_GRID } from "@/lib/canvas/brand";

type Geo = Pick<SlideElement, "x" | "y" | "w" | "h" | "rotation">;

/** Interactive freeform surface. Rendered INSIDE the scaled stage; `scale` is
 *  the CSS transform applied by PreviewStage, fed to Moveable's `zoom` so
 *  handles stay screen-sized while all geometry math stays in 1920-px design
 *  coordinates. */
export function CanvasStage({ slide, scale, ctx }: { slide: Slide; scale: number; ctx: BaseRenderCtx }) {
  const elements = slide.elements ?? [];
  const selectedIds = useDeck((s) => s.selectedElementIds);
  const editingId = useDeck((s) => s.editingElementId);
  const selectElements = useDeck((s) => s.selectElements);
  const setEditing = useDeck((s) => s.setEditingElement);
  const commitGeometry = useDeck((s) => s.commitGeometry);
  const updateElement = useDeck((s) => s.updateElement);

  const stageRef = useRef<HTMLDivElement>(null);
  const moveableRef = useRef<Moveable>(null);
  const nodeMap = useRef(new Map<string, HTMLElement>());
  const baseRef = useRef(new Map<string, Geo>());
  const draftRef = useRef<Record<string, Partial<SlideElement>>>({});

  const targets = selectedIds
    .map((id) => nodeMap.current.get(id))
    .filter(Boolean) as HTMLElement[];

  // Everything that is NOT selected becomes a snap target, so dragging one
  // element aligns to the edges and centres of the others.
  const unselectedNodes = elements
    .filter((el) => !selectedIds.includes(el.id))
    .map((el) => nodeMap.current.get(el.id))
    .filter(Boolean) as HTMLElement[];

  // Tracked outside React state so a shift press mid-drag takes effect without
  // a re-render tearing down the Moveable gesture.
  const shiftRef = useRef(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftRef.current = true;
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === "Shift") shiftRef.current = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Keep Moveable's box in sync when the selection or elements change.
  useEffect(() => {
    moveableRef.current?.updateRect();
  }, [selectedIds, elements, editingId]);

  const geoOf = (id: string): Geo => {
    const e = elements.find((x) => x.id === id)!;
    return { x: e.x, y: e.y, w: e.w, h: e.h, rotation: e.rotation };
  };
  const apply = (node: HTMLElement, g: Geo) => {
    node.style.transform = `translate(${g.x}px, ${g.y}px) rotate(${g.rotation}deg)`;
    node.style.width = `${g.w}px`;
    node.style.height = `${g.h}px`;
  };
  const startBase = (ids: string[]) => {
    baseRef.current.clear();
    draftRef.current = {};
    ids.forEach((id) => baseRef.current.set(id, geoOf(id)));
  };

  return (
    <div style={{ position: "relative", width: STAGE_W, height: STAGE_H }}>
      <Stage background={slide.background}>
        {elements.map((el) => {
          const editing = editingId === el.id && el.type === "text";
          return (
            <div
              key={el.id}
              className="canvas-el"
              data-el-id={el.id}
              ref={(n) => {
                if (n) nodeMap.current.set(el.id, n);
                else nodeMap.current.delete(el.id);
              }}
              onDoubleClick={(e) => {
                if (el.type === "text") {
                  e.stopPropagation();
                  selectElements([el.id]);
                  setEditing(el.id);
                }
              }}
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                width: el.w,
                height: el.h,
                transform: `translate(${el.x}px, ${el.y}px) rotate(${el.rotation}deg)`,
                cursor: "move",
                outline: selectedIds.includes(el.id) ? "2px solid var(--coral)" : "none",
                outlineOffset: 2,
              }}
            >
              {editing ? (
                <div
                  contentEditable
                  suppressContentEditableWarning
                  autoFocus
                  onBlur={(e) => {
                    updateElement(slide.id, el.id, { content: e.currentTarget.innerText });
                    setEditing(null);
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const text = e.clipboardData.getData("text/plain");
                    document.execCommand("insertText", false, text);
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                    whiteSpace: "pre-wrap",
                    overflow: "hidden",
                    outline: "none",
                    boxSizing: "border-box",
                    ...(el.style as React.CSSProperties),
                    // show raw text (with [[ ]]) while editing
                    color: (el.style.color as string) ?? "inherit",
                  }}
                >
                  {el.content ?? ""}
                </div>
              ) : (
                elementContent(el, ctx)
              )}
            </div>
          );
        })}
      </Stage>

      {!editingId && targets.length > 0 && (
        <Moveable
          ref={moveableRef}
          target={targets}
          zoom={1 / scale}
          origin={false}
          draggable
          resizable
          rotatable
          // Shift locks the aspect ratio while resizing — the one gesture every
          // design tool has and this canvas did not.
          keepRatio={shiftRef.current}
          snappable
          snapThreshold={6}
          snapGridWidth={SNAP_GRID}
          snapGridHeight={SNAP_GRID}
          verticalGuidelines={[0, STAGE_W / 2, STAGE_W]}
          horizontalGuidelines={[0, STAGE_H / 2, STAGE_H]}
          // Snap to the *other* elements, not just to the stage centre and a
          // blind 20px grid. Without this there are no smart guides at all.
          elementGuidelines={unselectedNodes}
          snapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
          elementSnapDirections={{ top: true, left: true, bottom: true, right: true, center: true, middle: true }}
          onDragStart={() => startBase(selectedIds)}
          onDrag={(e) => {
            const id = (e.target as HTMLElement).dataset.elId!;
            const b = baseRef.current.get(id)!;
            const g = { ...b, x: b.x + e.beforeTranslate[0], y: b.y + e.beforeTranslate[1] };
            draftRef.current[id] = { x: g.x, y: g.y };
            apply(e.target as HTMLElement, g);
          }}
          onDragGroupStart={() => startBase(selectedIds)}
          onDragGroup={(e) => {
            e.events.forEach((ev) => {
              const id = (ev.target as HTMLElement).dataset.elId!;
              const b = baseRef.current.get(id)!;
              const g = { ...b, x: b.x + ev.beforeTranslate[0], y: b.y + ev.beforeTranslate[1] };
              draftRef.current[id] = { x: g.x, y: g.y };
              apply(ev.target as HTMLElement, g);
            });
          }}
          onResizeStart={() => startBase(selectedIds)}
          onResize={(e) => {
            const id = (e.target as HTMLElement).dataset.elId!;
            const b = baseRef.current.get(id)!;
            const g = {
              ...b,
              w: Math.round(e.width),
              h: Math.round(e.height),
              x: b.x + e.drag.beforeTranslate[0],
              y: b.y + e.drag.beforeTranslate[1],
            };
            draftRef.current[id] = { w: g.w, h: g.h, x: g.x, y: g.y };
            apply(e.target as HTMLElement, g);
          }}
          onRotateStart={() => startBase(selectedIds)}
          onRotate={(e) => {
            const id = (e.target as HTMLElement).dataset.elId!;
            const b = baseRef.current.get(id)!;
            const g = { ...b, rotation: Math.round(e.rotation) };
            draftRef.current[id] = { rotation: g.rotation };
            apply(e.target as HTMLElement, g);
          }}
          onResizeGroupStart={() => startBase(selectedIds)}
          onResizeGroup={(e) => {
            e.events.forEach((ev) => {
              const id = (ev.target as HTMLElement).dataset.elId!;
              const b = baseRef.current.get(id)!;
              const g = {
                ...b,
                w: Math.round(ev.width),
                h: Math.round(ev.height),
                x: b.x + ev.drag.beforeTranslate[0],
                y: b.y + ev.drag.beforeTranslate[1],
              };
              draftRef.current[id] = { w: g.w, h: g.h, x: g.x, y: g.y };
              apply(ev.target as HTMLElement, g);
            });
          }}
          onRotateGroupStart={() => startBase(selectedIds)}
          onRotateGroup={(e) => {
            e.events.forEach((ev) => {
              const id = (ev.target as HTMLElement).dataset.elId!;
              const b = baseRef.current.get(id)!;
              const g = {
                ...b,
                rotation: Math.round(ev.rotation),
                x: b.x + ev.drag.beforeTranslate[0],
                y: b.y + ev.drag.beforeTranslate[1],
              };
              draftRef.current[id] = { rotation: g.rotation, x: g.x, y: g.y };
              apply(ev.target as HTMLElement, g);
            });
          }}
          onRenderEnd={() => flush()}
          onRenderGroupEnd={() => flush()}
        />
      )}

      <Selecto
        dragContainer={stageRef.current ?? undefined}
        selectableTargets={[".canvas-el"]}
        hitRate={0}
        selectByClick
        selectFromInside={false}
        toggleContinueSelect={["shift"]}
        onSelectEnd={(e) => {
          const ids = e.selected.map((n) => (n as HTMLElement).dataset.elId!).filter(Boolean);
          selectElements(ids);
        }}
      />
      {/* transparent hit layer for Selecto drag, behind elements */}
      <div ref={stageRef} style={{ position: "absolute", inset: 0, zIndex: -1 }} />
    </div>
  );

  function flush() {
    if (Object.keys(draftRef.current).length) {
      commitGeometry(slide.id, draftRef.current);
      draftRef.current = {};
    }
  }
}
