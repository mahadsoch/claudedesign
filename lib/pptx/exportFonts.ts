import { triggerDownload } from "@/lib/persistence/transfer";

/**
 * Download the brand TrueType faces (the ones embedded in the .pptx) as a zip,
 * for recipients on Mac PowerPoint or Google Slides where embedded fonts are
 * ignored. See `app/api/fonts/route.ts`.
 */
export async function downloadBrandFonts(): Promise<void> {
  const res = await fetch("/api/fonts");
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(`Font download failed: ${msg}`);
  }
  triggerDownload(await res.blob(), "soch-brand-fonts.zip");
}
