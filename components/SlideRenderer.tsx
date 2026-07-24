import type { Slide } from "@/lib/model/deck";
import type { RenderCtx } from "./templates/types";
import { getTemplate } from "./templates/registry";
import { Stage, StageBackgroundProvider } from "./templates/_shared/primitives";
import { FreeformSlide } from "./canvas/FreeformSlide";

/**
 * Renders a single slide. A template renders content into its own Stage; the
 * background comes from the slide (which can override the template default).
 * When a slide has explicit `elements` (Phase 3 freeform) they render on top.
 */
export function SlideRenderer({ slide, ctx }: { slide: Slide; ctx: RenderCtx }) {
  // Detached slides render from their element list (freeform), not the template.
  if (slide.elements && slide.elements.length > 0) {
    return <FreeformSlide slide={slide} ctx={ctx} />;
  }
  const tpl = getTemplate(slide.template);
  if (!tpl) {
    return (
      <Stage background={slide.background}>
        <div style={{ padding: 120, fontFamily: "var(--font-mono)", color: "var(--warm-gray)" }}>
          Unknown template: {slide.template}
        </div>
      </Stage>
    );
  }
  // Templates hardcode their own Stage background. To honour a slide-level
  // override we wrap the render in a provider that Stage reads; when the slide's
  // background differs from the template default, the override wins. When they
  // match (the common case) this is a no-op.
  const override = slide.background !== tpl.background ? slide.background : null;
  return (
    <StageBackgroundProvider value={override}>{tpl.render(slide.fields, ctx)}</StageBackgroundProvider>
  );
}
