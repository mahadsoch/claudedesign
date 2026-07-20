// Shared brand vocabulary for freeform editing. The toolbar and template
// expand() functions both draw from these so the canvas can only ever produce
// on-brand values.

// The type sizes the templates actually use.
export const TYPE_SCALE = [22, 24, 26, 30, 32, 34, 42, 52, 62, 72, 92, 104, 120, 190];

// The six core swatches (token strings — resolve to brand colors in both editor and PDF).
export const PALETTE: { label: string; value: string }[] = [
  { label: "Ink", value: "var(--ink)" },
  { label: "Cream", value: "var(--cream)" },
  { label: "Coral", value: "var(--coral)" },
  { label: "Stone", value: "var(--stone)" },
  { label: "Warm gray", value: "var(--warm-gray)" },
  { label: "Body light", value: "var(--body-light)" },
];

export const FONT_ROLES: { label: string; value: string }[] = [
  { label: "Display", value: "var(--font-title)" },
  { label: "Body", value: "var(--font-body)" },
  { label: "Mono", value: "var(--font-mono)" },
];

export const SNAP_GRID = 20;
