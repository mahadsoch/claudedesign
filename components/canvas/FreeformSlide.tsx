import type { Slide } from "@/lib/model/deck";
import type { BaseRenderCtx } from "@/components/templates/types";
import { Stage } from "@/components/templates/_shared/primitives";
import { renderElement } from "./renderElement";

// Static render of a detached (freeform) slide — used by SlideRenderer for
// thumbnails and by the /print page for the PDF. No handles, no interactivity.
export function FreeformSlide({ slide, ctx }: { slide: Slide; ctx: BaseRenderCtx }) {
  return (
    <Stage background={slide.background}>
      {(slide.elements ?? []).map((el) => (
        <div key={el.id}>{renderElement(el, ctx)}</div>
      ))}
    </Stage>
  );
}
