"use client";

import { createContext, useContext, type CSSProperties, type ReactNode } from "react";
import { STAGE_W, STAGE_H, type Background } from "@/lib/model/deck";
import { isIconRef, iconNameOf, renderIcon } from "@/lib/icons/iconSet";

// ── Stage: the fixed 1920×1080 slide surface ────────────────────────────────
const BG_STYLE: Record<Background, CSSProperties> = {
  dark: { background: "var(--ink)", color: "var(--cream)" },
  cream: { background: "var(--cream)", color: "var(--ink)" },
  coral: { background: "var(--coral)", color: "var(--cream)" },
};

// Templates hardcode their own `<Stage background="…">`. To let a slide override
// its background without editing all 25 templates, SlideRenderer wraps the
// render in this provider and Stage prefers the override when present.
const StageBackgroundCtx = createContext<Background | null>(null);

export function StageBackgroundProvider({
  value,
  children,
}: {
  value: Background | null;
  children: ReactNode;
}) {
  return <StageBackgroundCtx.Provider value={value}>{children}</StageBackgroundCtx.Provider>;
}

export function Stage({
  background,
  children,
  style,
}: {
  background: Background;
  children: ReactNode;
  style?: CSSProperties;
}) {
  const override = useContext(StageBackgroundCtx);
  const bg = override ?? background;
  return (
    <div
      className="slide-stage"
      style={{
        position: "relative",
        width: STAGE_W,
        height: STAGE_H,
        overflow: "hidden",
        fontFamily: "var(--font-body)",
        boxSizing: "border-box",
        ...BG_STYLE[bg],
        ...style,
      }}
    >
      {children}
    </div>
  );
}

// ── Kicker: the coral mono uppercase label above a title ─────────────────────
export function Kicker({
  children,
  color = "var(--coral)",
  style,
}: {
  children: ReactNode;
  color?: string;
  style?: CSSProperties;
}) {
  if (!children) return null;
  return (
    <div
      style={{
        fontFamily: "var(--font-mono)",
        fontSize: 24,
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

// ── AccentTitle: a Poppins title where [[…]] marks the coral accent span ──────
// e.g. "How to build [[AI-native]] teams." → "AI-native" rendered coral.
export function parseAccents(text: string): ReactNode[] {
  const parts: ReactNode[] = [];
  const re = /\[\[(.+?)\]\]/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    parts.push(
      <span key={i++} style={{ color: "var(--coral)" }}>
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
  size = 72,
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
        letterSpacing: size > 90 ? -4 : size > 60 ? -2 : -1,
        margin: 0,
        ...style,
      }}
    >
      {parseAccents(text)}
    </h1>
  );
}

// ── ImageBox: renders a resolved image or an on-brand placeholder ────────────
export function ImageBox({
  src,
  radius = 24,
  placeholder = "No image",
  style,
}: {
  src?: string;
  radius?: number;
  placeholder?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: radius,
        overflow: "hidden",
        background: src ? "transparent" : "rgba(138,133,120,0.18)",
        border: src ? "none" : "1.5px dashed rgba(138,133,120,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 20,
            letterSpacing: 1,
            color: "var(--warm-gray)",
          }}
        >
          {placeholder}
        </span>
      )}
    </div>
  );
}

// ── IconChip: a small coral-tinted rounded square holding an icon ─────────────
// Mirrors the peach icon chips in the proposal decks. `value` is the raw field
// string: either a bundled icon ref ("icon:<name>", drawn as an inline SVG) or
// an uploaded image ref (resolved to a src via `resolve`). Falls back to a coral
// dot when nothing is set, so a fresh slide still looks intentional.
export function IconChip({
  value,
  resolve,
  size = 72,
  radius = 16,
}: {
  value?: string;
  resolve?: (ref: string | undefined) => string | undefined;
  size?: number;
  radius?: number;
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
        background: "var(--coral-chip)",
        color: "var(--coral)",
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
        <div style={{ width: size * 0.3, height: size * 0.3, borderRadius: 9999, background: "var(--coral)" }} />
      )}
    </div>
  );
}

// ── SectionHead: the coral kicker + Poppins title used to open a content slide ─
export function SectionHead({
  kicker,
  title,
  size = 64,
  style,
}: {
  kicker?: string;
  title: string;
  size?: number;
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
          letterSpacing: -2,
          lineHeight: 1.06,
          margin: 0,
        }}
      >
        {parseAccents(title)}
      </h2>
    </div>
  );
}

// ── Logo lockup (uses /public/assets/soch-logo.png) ──────────────────────────
export function Logo({ height = 52 }: { height?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src="/assets/soch-logo.png"
      alt="Soch"
      style={{ height, width: "auto", alignSelf: "flex-start" }}
    />
  );
}
