import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { EMBED_FACES } from "@/lib/pptx/fonts";

export const runtime = "nodejs";

const ZIP_MIME = "application/zip";

/**
 * Download the brand TrueType faces used by the PPTX export, as one zip the
 * recipient can install.
 *
 * Embedded fonts cover the common case, but Mac PowerPoint and Google Slides
 * ignore `<p:embeddedFontLst>` entirely (see embedFonts.ts) — there the only fix
 * is having the faces installed locally. Same files, same single source of
 * truth: the list comes from `EMBED_FACES`, so a change to the shipped weights
 * needs no edit here.
 */
export async function GET() {
  const fontDir = path.join(process.cwd(), "public", "fonts");

  // EMBED_FACES names a file per PPTX slot, and Regular/Bold share a typeface,
  // so dedupe by filename.
  const files = [...new Set(EMBED_FACES.map((f) => f.file))];
  const present = files.filter((f) => fs.existsSync(path.join(fontDir, f)));
  if (present.length === 0) {
    return NextResponse.json({ error: "no fonts bundled in public/fonts" }, { status: 500 });
  }

  const zip = new JSZip();
  for (const f of present) zip.file(f, fs.readFileSync(path.join(fontDir, f)));
  zip.file("INSTALL.txt", installNotes(present));

  const buf = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  return new NextResponse(new Uint8Array(buf), {
    status: 200,
    headers: {
      "Content-Type": ZIP_MIME,
      "Content-Disposition": 'attachment; filename="soch-brand-fonts.zip"',
    },
  });
}

function installNotes(files: string[]): string {
  return [
    "Soch brand fonts",
    "================",
    "",
    "These are the typefaces used by the exported .pptx decks: Poppins (titles),",
    "Open Sans (body) and JetBrains Mono (kickers).",
    "",
    "You usually do not need them. The .pptx embeds these faces, so PowerPoint on",
    "Windows shows the deck correctly with nothing installed. Install them if you",
    "are opening the deck in *Mac PowerPoint* or *Google Slides*, which ignore",
    "embedded fonts, or if you want to edit decks and keep the brand type.",
    "",
    "Install (Windows)",
    "-----------------",
    "Select all the .ttf files, right-click, then 'Install for all users'.",
    "",
    "Install (macOS)",
    "---------------",
    "Select all the .ttf files and double-click, then 'Install Font' in Font Book.",
    "Quit and reopen PowerPoint afterwards so it picks them up.",
    "",
    "Google Slides",
    "-------------",
    "Slides cannot use locally installed fonts. Poppins, Open Sans and JetBrains",
    "Mono are all available via Slides' own font picker (More fonts…) — add them",
    "there. Note Slides has no separate 'Poppins SemiBold' entry, so weights will",
    "flatten; line breaks are pinned in the export, so the layout still holds.",
    "",
    "Licences",
    "--------",
    "All three families are SIL Open Font License 1.1 — free to install, use and",
    "redistribute.",
    "",
    "Files (" + files.length + ")",
    "--------",
    ...files.map((f) => "  " + f),
    "",
  ].join("\n");
}
