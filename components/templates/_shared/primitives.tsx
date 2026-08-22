import type { CSSProperties, ReactNode } from "react";
import { STAGE_W, STAGE_H, type Background } from "@/lib/model/deck";
import { isIconRef, iconNameOf, renderIcon } from "@/lib/icons/iconSet";

// ═══════════════════════════════════════════════════════════════════════════
// The template design system.
//
// Everything a template needs to look composed lives here. Two rules govern
// what may be added:
//
//  1. The PPTX exporter (lib/pptx/domExtract.ts) is a FLAT-DESIGN ENGINE. It
//     understands solid fills, uniform borders, uniform border-radius, single-
//     side borders (hairline rules), rotation, images and text. It silently
//     drops gradients, shadows, filters, blend modes, clip-path, ::before /
//     ::after and per-corner radii. Depth here comes from colour blocking and
//     rules, never from a shadow.
//  2. Non-rectangular ornament goes in an inline <svg>, which rasterises at 4×
//     with `currentColor` pinned — so SVG here strokes with currentColor and
//     never contains text (webfonts do not load inside an img-rendered SVG).
// ═══════════════════════════════════════════════════════════════════════════

// ── Type scale ──────────────────────────────────────────────────────────────
// One ramp for the whole library. Sizes are even so `pt = px/2` always lands on
// a clean 0.5pt boundary in PowerPoint.
export const TYPE = {
  stat: 190, // hero metric — DESIGN.md "Hero stats"
  statMd: 120,
  statSm: 76,
  display: 130, // pull-quote
  hero: 104, // deck opener
  h1: 88,
  h2: 72,
  h3: 60,
  h4: 46,
  h5: 36,
  h6: 30,
  body: 26,
  bodySm: 22,
  kicker: 24, // DESIGN.md mono kicker
  kickerSm: 20,
} as const;

/**
 * Optical tracking for a given title size. Titles need progressively tighter
 * letter-spacing as they grow. Exported (rather than inlined in `AccentTitle`)
 * so `render` and `expand` can never disagree about it — that drift is exactly
 * what CLAUDE.md warns about. Always returns a whole pixel, so the exported
 * value is a clean 0.5pt.
 */
export function titleTracking(size: number): number {
  if (size >= 160) return -6;
  if (size >= 120) return -5;
  if (size >= 96) return -4;
  if (size >= 76) return -3;
  if (size >= 56) return -2;
  if (size >= 34) return -1;
  return 0;
}

// ── Tone: the background-aware colour resolver ──────────────────────────────
// The keystone of the system. A template asks for `tone(ctx.background)` and
// gets the right token for every role, so the same layout reads correctly on
// ink, cream and coral. No template should reference a colour token directly.

export interface Tone {
  bg: Background;
  /** Primary text (titles, headings). */
  title: string;
  /** Body copy. */
  body: string;
  /** Emphasised body copy — one step up from `body`. */
  bodyStrong: string;
  /** Labels, sources, footnotes. */
  muted: string;
  /** The accent: coral on ink/cream, ink on coral. */
  accent: string;
  /** Text sitting on top of an `accent` fill. */
  onAccent: string;
  /** Hairline separator. */
  rule: string;
  /** Structural division — a heavier rule. */
  ruleStrong: string;
  /** Flat panel surface. */
  panel: string;
  /** Panel hairline, or "none" where the panel reads by fill alone. */
  panelBorder: string;
  /** Icon-chip fill. */
  chip: string;
  /** Icon-chip glyph colour. */
  chipInk: string;
}

const TONES: Record<Background, Tone> = {
  dark: {
    bg: "dark",
    title: "var(--cream)",
    body: "var(--body-dark)",
    bodyStrong: "var(--body-dark-2)",
    muted: "var(--warm-gray)",
    accent: "var(--coral)",
    onAccent: "var(--cream)",
    rule: "var(--border-dark)",
    ruleStrong: "var(--border-dark-2)",
    panel: "var(--ink-raised)",
    panelBorder: "var(--border-dark-2)",
    chip: "var(--ink-raised)",
    chipInk: "var(--coral)",
  },
  cream: {
    bg: "cream",
    title: "var(--ink)",
    body: "var(--body-light)",
    bodyStrong: "var(--ink)",
    muted: "var(--warm-gray)",
    accent: "var(--coral)",
    onAccent: "var(--cream)",
    rule: "var(--card-border)",
    ruleStrong: "var(--ink)",
    panel: "var(--card-fill)",
    panelBorder: "var(--card-border)",
    chip: "var(--coral-chip)",
    chipInk: "var(--coral)",
  },
  coral: {
    bg: "coral",
    title: "var(--cream)",
    body: "var(--on-coral-body)",
    bodyStrong: "var(--cream)",
    muted: "var(--on-coral-body)",
    // On a coral field the accent inverts to ink — still one accent per title,
    // still inside the palette, and it reads far harder than coral-on-coral.
    accent: "var(--ink)",
    onAccent: "var(--coral)",
    rule: "var(--on-coral-rule)",
    ruleStrong: "var(--cream)",
    panel: "var(--on-coral-panel)",
    panelBorder: "none",
    chip: "var(--on-coral-panel)",
    chipInk: "var(--cream)",
  },
};

export function tone(bg: Background): Tone {
  return TONES[bg];
}

// ── Stage: the fixed 1920×1080 slide surface ────────────────────────────────
// Also publishes `--accent` so `parseAccents` picks up the right accent colour
// for the background without every call site having to pass it down.
const BG_STYLE: Record<Background, CSSProperties> = {
  dark: { background: "var(--ink)", color: "var(--cream)" },
  cream: { background: "var(--cream)", color: "var(--ink)" },
  coral: { background: "var(--coral)", color: "var(--cream)" },
};

export function Stage({
  background,
  children,
  style,
  /** Set false for a full-bleed layout that manages its own insets. */
  padded = true,
}: {
  background: Background;
  children: ReactNode;
  style?: CSSProperties;
  padded?: boolean;
}) {
  const t = tone(background);
  return (
    <div
      className="slide-stage"
      style={
        {
          position: "relative",
          width: STAGE_W,
          height: STAGE_H,
          overflow: "hidden",
          fontFamily: "var(--font-body)",
          boxSizing: "border-box",
          "--accent": t.accent,
          ...BG_STYLE[background],
          ...(padded ? { padding: "var(--pad-y) var(--pad-x)" } : null),
          ...style,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}

// ── Kicker: the mono uppercase label above a title ──────────────────────────
export function Kicker({
  children,
  color = "var(--accent, var(--coral))",
  size = TYPE.kicker,
  style,
}: {
  children: ReactNode;
  color?: string;
  size?: number;
  style?: CSSProperties;
}) {
  if (!children) return null;
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: size,
        letterSpacing: 5,
        fontWeight: 500,
        textTransform: "uppercase",
        color,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── AccentTitle: a Poppins title where [[…]] marks the accent span ───────────
// e.g. "How to build [[AI-native]] teams." → "AI-native" in the accent colour.
//
// The span carries colour only. It must never paint a background or a border:
// a painting inline span splits the text block into overlapping marks in the
// PPTX exporter. Highlights go behind the text as their own positioned block.
export function parseAccents(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={i++} style={{ color: "var(--accent, var(--coral))" }}>
        {m[1]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts;
}

export function AccentTitle({
  text,
  size = TYPE.h2,
  style,
}: {
  text: string;
  size?: number;
  style?: CSSProperties;
}) {
  return (
    <h1
      style={{
        fontFamily: "var(--font-title)",
        fontWeight: 600,
        fontSize: size,
        lineHeight: 1.05,
        letterSpacing: titleTracking(size),
        margin: 0,
        ...style,
      }}
    >
      {parseAccents(text)}
    </h1>
  );
}

// ── SectionHead: kicker + title, the standard way to open a content slide ────
export function SectionHead({
  kicker,
  title,
  size = TYPE.h3,
  tone: t,
  style,
}: {
  kicker?: string;
  title: string;
  size?: number;
  tone?: Tone;
  style?: CSSProperties;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, ...style }}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <h2
        style={{
          fontFamily: "var(--font-title)",
          fontWeight: 600,
          fontSize: size,
          letterSpacing: titleTracking(size),
          lineHeight: 1.06,
          margin: 0,
          color: t?.title,
        }}
      >
        {parseAccents(title)}
      </h2>
    </div>
  );
}

// ── Rule: the one divider ───────────────────────────────────────────────────
// Replaces the nine ad-hoc border treatments the library had grown. Renders as
// a filled div, which the exporter emits as a native PowerPoint rectangle.
export type RuleWeight = "hair" | "1" | "2" | "heavy";
const RULE_PX: Record<RuleWeight, string> = {
  hair: "var(--rule-hair)",
  "1": "var(--rule-1)",
  "2": "var(--rule-2)",
  heavy: "var(--rule-heavy)",
};

export function Rule({
  tone: t,
  weight = "hair",
  color,
  vertical = false,
  length,
  style,
}: {
  tone: Tone;
  weight?: RuleWeight;
  /** Override the tone-derived colour (e.g. the accent). */
  color?: string;
  vertical?: boolean;
  /** Fixed length; omit to fill the cross axis. */
  length?: number | string;
  style?: CSSProperties;
}) {
  const thickness = RULE_PX[weight];
  const paint = color ?? (weight === "hair" ? t.rule : t.ruleStrong);
  return (
    <div
      style={{
        background: paint,
        flex: "none",
        ...(vertical
          ? { width: thickness, height: length ?? "100%" }
          : { height: thickness, width: length ?? "100%" }),
        ...style,
      }}
    />
  );
}

// ── Numeral: the index marker ───────────────────────────────────────────────
// Mono, per DESIGN.md ("Kickers / labels / numbers — JetBrains Mono"). This is
// a list index, not a metric — a metric is a `Stat`, which is Poppins.
const ROMAN = ["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x", "xi", "xii"];

export function Numeral({
  n,
  tone: t,
  size = TYPE.h5,
  color,
  variant = "pad",
  style,
}: {
  /** 1-based index. */
  n: number;
  tone: Tone;
  size?: number;
  color?: string;
  /** "pad" → 01, "plain" → 1, "roman" → i. */
  variant?: "pad" | "plain" | "roman";
  style?: CSSProperties;
}) {
  const label =
    variant === "roman"
      ? `${ROMAN[n - 1] ?? n}.`
      : variant === "plain"
        ? String(n)
        : String(n).padStart(2, "0");
  return (
    <span
      style={{
        fontFamily: "var(--font-mono)",
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: size > 60 ? -1 : 1,
        color: color ?? t.accent,
        fontVariantNumeric: "tabular-nums",
        ...style,
      }}
    >
      {label}
    </span>
  );
}

// ── Stat: the hero metric ───────────────────────────────────────────────────
// Poppins, per DESIGN.md ("Hero stats — Poppins 600, ~190px, the unit ~half").
export function Stat({
  value,
  unit,
  size = TYPE.statSm,
  color,
  style,
}: {
  value: string;
  unit?: string;
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        fontFamily: "var(--font-title)",
        fontWeight: 600,
        fontSize: size,
        lineHeight: 0.95,
        letterSpacing: titleTracking(size),
        color,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {value}
      {unit ? (
        <span style={{ fontSize: Math.round(size * 0.52), letterSpacing: titleTracking(size * 0.52) }}>
          {unit}
        </span>
      ) : null}
    </div>
  );
}

/** A ▲/▼ delta chip beside a stat. Uses SVG so the glyph is not font-dependent. */
export function Delta({
  dir,
  label,
  tone: t,
  size = TYPE.bodySm,
}: {
  dir: "up" | "down";
  label: string;
  tone: Tone;
  size?: number;
}) {
  const paint = t.accent;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, color: paint }}>
      <svg
        viewBox="0 0 12 12"
        width={Math.round(size * 0.7)}
        height={Math.round(size * 0.7)}
        style={{ display: "block", color: paint }}
      >
        <path
          d={dir === "up" ? "M6 1L11 10H1z" : "M6 11L1 2h10z"}
          fill="currentColor"
        />
      </svg>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: size, letterSpacing: 1.5, fontWeight: 600 }}>
        {label}
      </span>
    </div>
  );
}

// ── Surfaces ────────────────────────────────────────────────────────────────

/** A bordered card. `emphasis` promotes one card in a row to the focal point. */
export function Card({
  tone: t,
  emphasis = "none",
  children,
  style,
}: {
  tone: Tone;
  emphasis?: "none" | "accent" | "invert";
  children: ReactNode;
  style?: CSSProperties;
}) {
  const skin: CSSProperties =
    emphasis === "accent"
      ? { background: t.accent, color: t.onAccent, border: `var(--rule-1) solid ${t.accent}` }
      : emphasis === "invert"
        ? {
            background: t.bg === "cream" ? "var(--ink)" : "var(--cream)",
            color: t.bg === "cream" ? "var(--cream)" : "var(--ink)",
            border: "none",
          }
        : {
            background: t.panel,
            color: t.title,
            border: t.panelBorder === "none" ? "none" : `var(--rule-hair) solid ${t.panelBorder}`,
          };
  return (
    <div
      style={{
        borderRadius: "var(--r-card)",
        padding: "var(--s5) var(--s5)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        ...skin,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A flat, borderless surface — the coral-wash device, systematised. */
export function Panel({
  tone: t,
  children,
  style,
}: {
  tone: Tone;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const fill =
    t.bg === "cream" ? "var(--coral-wash)" : t.bg === "dark" ? "var(--ink-raised)" : "var(--on-coral-panel)";
  return (
    <div
      style={{
        background: fill,
        borderRadius: "var(--r-panel)",
        padding: "var(--s6) var(--s6)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/** A mono uppercase chip. `solid` fills with the accent; `outline` is a hairline. */
export function Pill({
  children,
  tone: t,
  variant = "solid",
  size = TYPE.kickerSm,
  style,
}: {
  children: ReactNode;
  tone: Tone;
  variant?: "solid" | "outline";
  size?: number;
  style?: CSSProperties;
}) {
  const skin: CSSProperties =
    variant === "solid"
      ? { background: t.accent, color: t.onAccent, border: "none" }
      : { background: "transparent", color: t.body, border: `var(--rule-hair) solid ${t.rule}` };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        fontFamily: "var(--font-mono)",
        fontWeight: 600,
        fontSize: size,
        letterSpacing: 2,
        textTransform: "uppercase",
        borderRadius: "var(--r-pill)",
        padding: `${Math.round(size * 0.42)}px ${Math.round(size * 1.1)}px`,
        whiteSpace: "nowrap",
        ...skin,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** The CTA button from DESIGN.md — coral fill, cream text, fully rounded. */
export function Button({
  children,
  tone: t,
  style,
}: {
  children: ReactNode;
  tone: Tone;
  style?: CSSProperties;
}) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        background: t.accent,
        color: t.onAccent,
        fontFamily: "var(--font-title)",
        fontWeight: 600,
        fontSize: 28,
        borderRadius: "var(--r-pill)",
        padding: "22px 52px",
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** A list bullet — a small accent square, optically raised to the text baseline. */
export function Bullet({ tone: t, size = 11 }: { tone: Tone; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: 3,
        background: t.accent,
        flex: "none",
        position: "relative",
        top: -Math.round(size * 0.55),
      }}
    />
  );
}

// ── Slide furniture ─────────────────────────────────────────────────────────

/**
 * The running footer: logo on the left, an optional label, and the slide number
 * on the right. Absolutely positioned against the stage so it sits on the page
 * margin regardless of what the content above it does.
 */
export function SlideFooter({
  tone: t,
  label,
  slideNumber,
  slideCount,
  logo = true,
}: {
  tone: Tone;
  label?: string;
  slideNumber?: number;
  slideCount?: number;
  logo?: boolean;
}) {
  const showNum = typeof slideNumber === "number";
  if (!logo && !label && !showNum) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: "var(--pad-x)",
        right: "var(--pad-x)",
        bottom: 46,
        display: "flex",
        alignItems: "center",
        gap: "var(--s3)",
      }}
    >
      {logo ? <Logo height={30} /> : null}
      {label ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 18,
            letterSpacing: 3,
            textTransform: "uppercase",
            color: t.muted,
          }}
        >
          {label}
        </span>
      ) : null}
      <span style={{ flex: 1 }} />
      {showNum ? (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 18,
            letterSpacing: 2,
            fontWeight: 600,
            color: t.muted,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {String(slideNumber).padStart(2, "0")}
          {slideCount ? ` / ${String(slideCount).padStart(2, "0")}` : ""}
        </span>
      ) : null}
    </div>
  );
}

// ── Logo lockup (uses /public/assets/soch-logo.png) ──────────────────────────
// Note: no CSS `filter` recolouring here — filters are dropped by the PPTX
// exporter, so a knocked-out logo would come back wrong in the .pptx. If the
// mark ever needs a light and a dark variant, ship two assets.
export function Logo({ height = 52, style }: { height?: number; style?: CSSProperties }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/assets/soch-logo.png"
      alt="Soch"
      style={{ height, width: "auto", alignSelf: "flex-start", ...style }}
    />
  );
}

// ── Images ──────────────────────────────────────────────────────────────────

/** Renders a resolved image or an on-brand placeholder. */
export function ImageBox({
  src,
  radius = 24,
  placeholder = "No image",
  tone: t,
  style,
}: {
  src?: string;
  radius?: number | string;
  placeholder?: string;
  tone?: Tone;
  style?: CSSProperties;
}) {
  const muted = t?.muted ?? "var(--warm-gray)";
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius,
        overflow: "hidden",
        background: src ? "transparent" : t ? t.panel : "rgba(138,133,120,0.18)",
        border: src ? "none" : `var(--rule-hair) solid ${t ? t.rule : "rgba(138,133,120,0.5)"}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 20,
            letterSpacing: 1,
            color: muted,
          }}
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}

/**
 * A portrait frame that degrades gracefully: the photo when there is one, an
 * initials monogram when there is not. Templates that ship people in their
 * defaults must use this — a grid of dashed "Photo" boxes on insert is the
 * single most common way this deck looks unfinished.
 */
export function Portrait({
  src,
  name,
  tone: t,
  radius = "var(--r-card)",
  style,
}: {
  src?: string;
  name?: string;
  tone: Tone;
  radius?: number | string;
  style?: CSSProperties;
}) {
  if (src) return <ImageBox src={src} radius={radius} tone={t} style={style} />;
  const initials = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  // The monogram frame has to separate from the field it sits on. On coral,
  // `t.panel` is only a shade off the background, so the frame would vanish.
  const fill =
    t.bg === "cream" ? "var(--coral-wash)" : t.bg === "coral" ? "var(--cream)" : "var(--ink-raised)";
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        borderRadius: radius,
        background: fill,
        color: t.bg === "coral" ? "var(--coral)" : t.accent,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        boxSizing: "border-box",
        ...style,
      }}
    >
      <span
        style={{
          fontFamily: "var(--font-title)",
          fontWeight: 600,
          fontSize: 84,
          letterSpacing: -2,
          lineHeight: 1,
        }}
      >
        {initials || "—"}
      </span>
    </div>
  );
}

// ── IconChip: a tinted rounded square holding an icon ────────────────────────
export function IconChip({
  value,
  resolve,
  tone: t,
  size = 72,
  radius = "var(--r-chip)",
}: {
  value?: string;
  resolve?: (ref: string | undefined) => string | undefined;
  tone?: Tone;
  size?: number;
  radius?: number | string;
}) {
  const iconName = iconNameOf(value);
  const src = !isIconRef(value) && resolve ? resolve(value) : undefined;
  return (
    <div
      style={{
        width: size,
        height: size,
        flex: `0 0 ${size}px`,
        borderRadius: radius,
        background: t?.chip ?? "var(--coral-chip)",
        color: t?.chipInk ?? "var(--coral)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {iconName ? (
        renderIcon(iconName, Math.round(size * 0.5))
      ) : src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" style={{ width: "58%", height: "58%", objectFit: "contain" }} />
      ) : (
        <div
          style={{
            width: size * 0.3,
            height: size * 0.3,
            borderRadius: 9999,
            background: t?.chipInk ?? "var(--coral)",
          }}
        />
      )}
    </div>
  );
}

// ── Data geometry ───────────────────────────────────────────────────────────
// Bars and tracks are plain divs so they export as NATIVE, editable PowerPoint
// rectangles. Only genuinely curved geometry (the ring, the arrowhead) uses
// SVG, which rasterises. Never put text inside these — labels go alongside.

/** A horizontal meter: a full-width track with an accent fill to `pct` (0–1). */
export function Meter({
  pct,
  tone: t,
  height = 14,
  color,
  track = true,
  style,
}: {
  pct: number;
  tone: Tone;
  height?: number;
  color?: string;
  track?: boolean;
  style?: CSSProperties;
}) {
  const clamped = Math.max(0, Math.min(1, pct));
  return (
    <div
      style={{
        width: "100%",
        height,
        borderRadius: height / 2,
        background: track ? t.rule : "transparent",
        overflow: "hidden",
        ...style,
      }}
    >
      <div
        style={{
          width: `${clamped * 100}%`,
          height: "100%",
          borderRadius: height / 2,
          background: color ?? t.accent,
        }}
      />
    </div>
  );
}

/**
 * A vertical column for bar charts. Sits on its own baseline, so a row of them
 * shares one rule. `pct` is 0–1 of the available height.
 */
export function Column({
  pct,
  tone: t,
  color,
  radius = 8,
  style,
}: {
  pct: number;
  tone: Tone;
  color?: string;
  radius?: number;
  style?: CSSProperties;
}) {
  const clamped = Math.max(0.02, Math.min(1, pct));
  return (
    <div
      style={{
        width: "100%",
        height: `${clamped * 100}%`,
        background: color ?? t.accent,
        borderRadius: `${radius}px ${radius}px 0 0`,
        alignSelf: "flex-end",
        ...style,
      }}
    />
  );
}

/**
 * A progress ring. The track is a bordered div (a native PPTX ellipse); the
 * arc is an SVG stroke using `currentColor`, which rasterises at 4×.
 */
export function Ring({
  pct,
  tone: t,
  size = 240,
  thickness = 22,
  color,
  children,
}: {
  pct: number;
  tone: Tone;
  size?: number;
  thickness?: number;
  color?: string;
  /** Centred label — rendered as HTML on top, never inside the SVG. */
  children?: ReactNode;
}) {
  const clamped = Math.max(0, Math.min(1, pct));
  const r = (size - thickness) / 2;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: "relative", width: size, height: size, flex: "none" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          border: `${thickness}px solid ${t.rule}`,
          boxSizing: "border-box",
        }}
      />
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        fill="none"
        style={{ position: "absolute", inset: 0, color: color ?? t.accent, transform: "rotate(-90deg)" }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={thickness}
          strokeLinecap="butt"
          strokeDasharray={`${circ * clamped} ${circ}`}
        />
      </svg>
      {children ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}

/**
 * A directional arrowhead. Used for axes and process flows in place of the
 * literal ↑/→ glyphs, which fall outside the three brand families and get
 * silently coerced to Open Sans on export.
 */
export function Arrow({
  dir = "right",
  size = 28,
  color,
  style,
}: {
  dir?: "right" | "left" | "up" | "down";
  size?: number;
  color?: string;
  style?: CSSProperties;
}) {
  const rot = { right: 0, down: 90, left: 180, up: 270 }[dir];
  return (
    <svg
      viewBox="0 0 12 12"
      width={size}
      height={size}
      style={{ display: "block", color, transform: `rotate(${rot}deg)`, flex: "none", ...style }}
    >
      <path d="M2 1l7 5-7 5z" fill="currentColor" />
    </svg>
  );
}

/** A ✓ or — mark for comparison tables. SVG so it is not font-dependent. */
export function Mark({
  kind,
  size = 30,
  color,
}: {
  kind: "yes" | "no";
  size?: number;
  color?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ display: "block", color }}
    >
      {kind === "yes" ? <path d="M4 12.5l5.5 5.5L20 6" /> : <path d="M5 12h14" />}
    </svg>
  );
}

/**
 * A timeline rail: a continuous rule with a node per step, and the segment up
 * to `activeIndex` painted in the accent. Nodes are absolutely positioned at
 * the centre of each of `count` equal columns, so they line up with a grid of
 * the same count above or below.
 */
export function Track({
  count,
  tone: t,
  activeIndex = -1,
  node = 16,
  align = "centre",
  style,
}: {
  count: number;
  tone: Tone;
  /** 0-based; the rail is accented up to and including this node. */
  activeIndex?: number;
  node?: number;
  /**
   * Where each node sits within its column. Use "start" when the column content
   * below is left-aligned, so the nodes line up with it rather than floating
   * over the middle of the text.
   */
  align?: "centre" | "start";
  style?: CSSProperties;
}) {
  const n = Math.max(count, 1);
  // Fraction of the width at which node `i` sits. With align="start" the nodes
  // land on each column's left edge; with "centre", on its midpoint.
  const at = (i: number) => (align === "start" ? i / n : (i + 0.5) / n) * 100;
  // Node boxes are placed by their left edge and pulled back by half their own
  // width, except the first/last in "start" mode, which would otherwise hang
  // off the stage. The rail is then inset by the same half-node so it starts
  // and ends exactly under a node centre.
  const half = node / 2;
  const railLeft = `calc(${at(0)}% + ${half}px)`;
  const railRight = `calc(${100 - at(n - 1)}% - ${half}px)`;
  const activeAt = activeIndex >= 0 ? at(Math.min(activeIndex, n - 1)) : 0;
  return (
    <div style={{ position: "relative", width: "100%", height: node, ...style }}>
      <div
        style={{
          position: "absolute",
          left: railLeft,
          right: railRight,
          top: half - 1,
          height: "var(--rule-1)",
          background: t.rule,
        }}
      />
      {activeIndex >= 0 ? (
        <div
          style={{
            position: "absolute",
            left: railLeft,
            width: `calc(${Math.max(activeAt - at(0), 0)}%)`,
            top: half - 1,
            height: "var(--rule-1)",
            background: t.accent,
          }}
        />
      ) : null}
      {Array.from({ length: n }, (_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${at(i)}%`,
            top: 0,
            width: node,
            height: node,
            borderRadius: "50%",
            boxSizing: "border-box",
            background: activeIndex < 0 || i <= activeIndex ? t.accent : t.panel,
            border:
              activeIndex >= 0 && i > activeIndex ? `var(--rule-1) solid ${t.rule}` : "none",
          }}
        />
      ))}
    </div>
  );
}
