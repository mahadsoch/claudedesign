import type { CSSProperties } from "react";
import type { SlideElement } from "@/lib/model/deck";
import type { RenderCtx } from "@/components/templates/types";
import { parseAccents } from "@/components/templates/_shared/primitives";

// The visual content of an element, filling its box (no positioning). Shared by
// the static renderer (print/thumbnails) and the interactive canvas wrapper, so
// what you edit is exactly what the PDF shows.
export function elementContent(el: SlideElement, ctx: RenderCtx) {
  const style = el.style as CSSProperties;

  if (el.type === "text") {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          whiteSpace: "pre-wrap",
          overflow: "hidden",
          boxSizing: "border-box",
          ...style,
        }}
      >
        {parseAccents(el.content ?? "")}
      </div>
    );
  }

  if (el.type === "image") {
    const src = ctx.resolveImage(el.content);
    return src ? (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt=""
        style={{
          width: "100%",
          height: "100%",
          objectFit: (style.objectFit as CSSProperties["objectFit"]) ?? "cover",
          borderRadius: style.borderRadius as number | undefined,
          display: "block",
        }}
      />
    ) : (
      <div
        style={{
          width: "100%",
          height: "100%",
          border: "1.5px dashed rgba(138,133,120,0.5)",
          borderRadius: (style.borderRadius as number) ?? 12,
        }}
      />
    );
  }

  // shape — background / borderRadius live in el.style
  return <div style={{ width: "100%", height: "100%", boxSizing: "border-box", ...style }} />;
}

// Static, absolutely-positioned render of one element (print, thumbnails).
export function renderElement(el: SlideElement, ctx: RenderCtx) {
  return (
    <div
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.w,
        height: el.h,
        transform: el.rotation ? `rotate(${el.rotation}deg)` : undefined,
        boxSizing: "border-box",
      }}
    >
      {elementContent(el, ctx)}
    </div>
  );
}
