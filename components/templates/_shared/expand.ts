import type { Background, FieldValue, SlideElement } from "@/lib/model/deck";
import { uid } from "@/lib/model/deck";
import type { FieldDef, TemplateDef } from "../types";
import { str, rows } from "../types";

// Generic fallback for "Detach to canvas" on templates that don't hand-author an
// expand(). It walks the template's field schema and lays the content out as a
// simple top-to-bottom stack of absolutely-positioned elements on the 1920×1080
// stage. It won't reproduce the template's polished layout — it's a *starting
// point* the user then arranges freely (and "Reset to template" always restores
// the original). Text colors follow the slide background so contrast holds.

const PAD_X = 120;
const CONTENT_W = 1920 - PAD_X * 2; // 1680

function titleColor(bg: Background): string {
  return bg === "cream" ? "var(--ink)" : "var(--cream)";
}
function bodyColor(bg: Background): string {
  return bg === "cream" ? "var(--body-light)" : "var(--body-dark)";
}

type Role = "kicker" | "title" | "body";
function roleOf(f: FieldDef): Role {
  const k = f.key.toLowerCase();
  if (k === "kicker") return "kicker";
  if (/(title|statement|quote|heading|headline)/.test(k)) return "title";
  return "body";
}

const kickerStyle = () => ({
  fontFamily: "var(--font-mono)",
  fontSize: 24,
  letterSpacing: 5,
  fontWeight: 500,
  textTransform: "uppercase",
  color: "var(--coral)",
});
const titleStyle = (bg: Background) => ({
  fontFamily: "var(--font-title)",
  fontSize: 84,
  fontWeight: 600,
  letterSpacing: -3,
  lineHeight: 1.05,
  color: titleColor(bg),
});
const bodyStyle = (bg: Background) => ({
  fontFamily: "var(--font-body)",
  fontSize: 30,
  lineHeight: 1.5,
  color: bodyColor(bg),
});

export function expandGeneric(
  tpl: TemplateDef,
  fields: Record<string, FieldValue>,
  bg: Background
): SlideElement[] {
  const els: SlideElement[] = [];
  let y = 110;
  const push = (el: Omit<SlideElement, "id">) => els.push({ ...el, id: uid("el") });

  for (const f of tpl.fields) {
    if (f.type === "image") {
      push({
        type: "image",
        x: PAD_X,
        y,
        w: 520,
        h: 360,
        rotation: 0,
        style: { borderRadius: 20, objectFit: "cover" },
        content: str(fields[f.key]),
        fieldKey: f.key,
      });
      y += 400;
      continue;
    }

    if (f.type === "list") {
      for (const item of rows(fields[f.key])) {
        for (const sub of f.itemFields ?? []) {
          if (sub.type === "image") continue; // skip nested images in the generic stack
          const val = item[sub.key] ?? "";
          if (!val) continue;
          push({
            type: "text",
            x: PAD_X,
            y,
            w: CONTENT_W,
            h: 44,
            rotation: 0,
            style: bodyStyle(bg),
            content: val,
          });
          y += 50;
        }
        y += 14;
      }
      continue;
    }

    // text / textarea
    const val = str(fields[f.key]);
    const role = roleOf(f);
    if (role === "kicker") {
      push({ type: "text", x: PAD_X, y, w: CONTENT_W, h: 34, rotation: 0, style: kickerStyle(), content: val, fieldKey: f.key });
      y += 54;
    } else if (role === "title") {
      push({ type: "text", x: PAD_X, y, w: CONTENT_W, h: 130, rotation: 0, style: titleStyle(bg), content: val, fieldKey: f.key });
      y += 156;
    } else {
      push({ type: "text", x: PAD_X, y, w: CONTENT_W, h: 84, rotation: 0, style: bodyStyle(bg), content: val, fieldKey: f.key });
      y += 100;
    }
  }

  return els;
}
