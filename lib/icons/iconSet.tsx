import type { ReactElement } from "react";

// ── Bundled icon set ─────────────────────────────────────────────────────────
// A small, self-contained set of single-colour line icons drawn on a 24×24
// grid. They use `stroke: currentColor`, so they take the colour of whatever
// renders them (the coral chip in IconChip). This keeps the app fully local —
// no icon library, no network fetch — while giving slides real icons instead of
// a blank placeholder dot.
//
// Icon values are stored on a slide as the string `icon:<name>` (see IconChip),
// which piggybacks on the existing image-typed field without a model change.

export const ICON_PREFIX = "icon:";

// Inner SVG markup per icon. Each is drawn to look intentional at ~24px inside
// the coral chip. Strings are static (never user input) so rendering them via
// dangerouslySetInnerHTML is safe.
const ICONS: Record<string, string> = {
  workflow:
    '<rect x="3" y="4" width="6" height="6" rx="1.5"/><rect x="15" y="14" width="6" height="6" rx="1.5"/><path d="M9 7h4a2 2 0 0 1 2 2v5"/>',
  invoice:
    '<path d="M7 3h7l4 4v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
  chart: '<path d="M4 4v16h16"/><path d="M8 16v-4M12 16v-7M16 16v-2"/>',
  rocket:
    '<path d="M12 3c2.8 1 4.5 4 4.5 8L15 14H9l-1.5-3c0-4 1.7-7 4.5-8z"/><circle cx="12" cy="9" r="1.5"/><path d="M9 14l-2 4M15 14l2 4"/>',
  shield: '<path d="M12 3l7 3v5c0 4-3 7-7 8-4-1-7-4-7-8V6z"/><path d="M9 12l2 2 4-4"/>',
  team:
    '<circle cx="9" cy="9" r="3"/><circle cx="16.5" cy="10" r="2.5"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15 19a4.5 4.5 0 0 1 6-2.4"/>',
  gear:
    '<circle cx="12" cy="12" r="3.2"/><path d="M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.1 5.1l2.1 2.1M16.8 16.8l2.1 2.1M18.9 5.1l-2.1 2.1M7.2 16.8l-2.1 2.1"/>',
  sparkle: '<path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20.5 20.5l-4-4"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6z"/><path d="M10 19a2 2 0 0 0 4 0"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3.5 7l8.5 6 8.5-6"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  target:
    '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
  handoff: '<path d="M4 9h13l-3.5-3.5M20 15H7l3.5 3.5"/>',
  test: '<path d="M9 3h6M10 3v6l-5 9a1.2 1.2 0 0 0 1 1.9h12a1.2 1.2 0 0 0 1-1.9l-5-9V3"/><path d="M8 15h8"/>',
  book: '<path d="M5 4h11a2 2 0 0 1 2 2v13H7a2 2 0 0 0-2 2z"/><path d="M5 4v15"/><path d="M9 8h6M9 12h6"/>',
  warning: '<path d="M12 3.5l9 16H3z"/><path d="M12 10v4"/><path d="M12 16.7v.3"/>',
  plug: '<path d="M9 3v5M15 3v5"/><path d="M7 8h10v2.5a5 5 0 0 1-10 0z"/><path d="M12 15.5V21"/>',
  database:
    '<ellipse cx="12" cy="6" rx="7" ry="3"/><path d="M5 6v12c0 1.6 3.1 3 7 3s7-1.4 7-3V6"/><path d="M5 12c0 1.6 3.1 3 7 3s7-1.4 7-3"/>',
  lock: '<rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
};

/** Ordered list of icon names, for the picker grid. */
export const iconNames: string[] = Object.keys(ICONS);

/** True if a field value refers to a bundled icon (`icon:<name>`). */
export function isIconRef(value: string | undefined): boolean {
  return typeof value === "string" && value.startsWith(ICON_PREFIX);
}

/** Extract the icon name from an `icon:<name>` ref (or "" if not one / unknown). */
export function iconNameOf(value: string | undefined): string {
  if (!isIconRef(value)) return "";
  const name = value!.slice(ICON_PREFIX.length);
  return name in ICONS ? name : "";
}

/** Render a bundled icon as an inline SVG, or null if the name is unknown. */
export function renderIcon(name: string, size = 28): ReactElement | null {
  const inner = ICONS[name];
  if (!inner) return null;
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
