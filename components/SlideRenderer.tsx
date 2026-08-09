import type { Slide } from "@/lib/model/deck";
import type { BaseRenderCtx, RenderCtx } from "./templates/types";
import { getTemplate } from "./templates/registry";
import { Stage } from "./templates/_shared/primitives";
import { FreeformSlide } from "./canvas/FreeformSlide";

/**
 * Renders a single slide.
 *
 * The slide — not the template — owns the background. A template declares a
 * sensible default at insert time, but from then on `slide.background` is the
 * truth, and every template renders its `Stage` from `ctx.background` and
 * derives its colours from `tone(ctx.background)`. That is what makes the
 * deck's background rhythm (DESIGN.md) editable rather than an accident of
 * which templates happened to be chosen.
 *
 * Detached slides render from their element list (freeform) instead.
 */
export function SlideRenderer({
  slide,
  ctx,
  slideNumber,
  slideCount,
}: {
  slide: Slide;
  ctx: BaseRenderCtx;
  slideNumber?: number;
  slideCount?: number;
}) {
  const full: RenderCtx = { ...ctx, background: slide.background, slideNumber, slideCount };

  if (slide.elements && slide.elements.length > 0) {
    return <FreeformSlide slide={slide} ctx={full} />;
  }

  const tpl = getTemplate(slide.template);
  if (!tpl) {
    return (
      <Stage background={slide.background}>
        <div style={{ fontFamily: "var(--font-mono)", color: "var(--warm-gray)" }}>
          Unknown template: {slide.template}
        </div>
      </Stage>
    );
  }
  return <>{tpl.render(slide.fields, full)}</>;
}
