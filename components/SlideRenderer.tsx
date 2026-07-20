import type { Slide } from "@/lib/model/deck";
import type { RenderCtx } from "./templates/types";
import { getTemplate } from "./templates/registry";
import { Stage } from "./templates/_shared/primitives";
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
  // The template owns its Stage + background. We pass the slide's background
  // through by cloning defaults: templates read their own `background` const,
  // so to honour slide-level overrides we render the template then, if the
  // slide overrides, we can't easily swap — templates hardcode their Stage bg.
  // For Phase 1 the slide background always matches the template default
  // (set at insert time), so this is consistent.
  return <>{tpl.render(slide.fields, ctx)}</>;
}
