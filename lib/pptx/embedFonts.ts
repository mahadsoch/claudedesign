import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { EMBED_FACES } from "./fonts";

/**
 * Inject OOXML embedded fonts into a finished .pptx.
 *
 * pptxgenjs cannot do this, so we reopen the zip and add the four things
 * PowerPoint looks for:
 *
 *   1. `ppt/fonts/fontN.fntdata` — the raw TrueType bytes. Unlike legacy
 *      DOC/EOT embedding, PPTX does not obfuscate font data.
 *   2. a `fntdata` default in `[Content_Types].xml`
 *   3. `.../relationships/font` entries in `ppt/_rels/presentation.xml.rels`
 *   4. `<p:embeddedFontLst>` in `presentation.xml`, plus
 *      `embedTrueTypeFonts="1"`
 *
 * Element order matters in `CT_Presentation`: `embeddedFontLst` sits after
 * `notesSz` and before `defaultTextStyle`, which is where we splice it.
 *
 * Missing .ttf files are skipped with a warning — a deck without embedded fonts
 * is still a correct deck, just one that relies on the viewer having the fonts.
 * Recipients on Mac PowerPoint or Google Slides ignore embedded fonts entirely;
 * because wrapped text carries pinned line breaks, they lose glyph shapes but
 * not layout.
 */
export async function embedFonts(
  pptx: Buffer,
  fontDir: string
): Promise<{ buffer: Buffer; embedded: string[]; warnings: string[] }> {
  const warnings: string[] = [];
  const embedded: string[] = [];

  const faces = EMBED_FACES.map((f) => ({ face: f, file: path.join(fontDir, f.file) })).filter((f) => {
    if (fs.existsSync(f.file)) return true;
    warnings.push("Font not bundled, skipping embed: " + f.face.file);
    return false;
  });
  if (faces.length === 0) {
    warnings.push("No fonts embedded — recipients will need Poppins, Open Sans and JetBrains Mono installed.");
    return { buffer: pptx, embedded, warnings };
  }

  const zip = await JSZip.loadAsync(pptx);
  const readText = async (name: string): Promise<string> => {
    const f = zip.file(name);
    if (!f) throw new Error("Malformed pptx: missing " + name);
    return await f.async("string");
  };

  const relsName = "ppt/_rels/presentation.xml.rels";
  let rels = await readText(relsName);
  let presentation = await readText("ppt/presentation.xml");
  let types = await readText("[Content_Types].xml");

  // Continue the existing rId sequence so nothing collides.
  let nextRel = 1;
  const idRe = /Id="rId(\d+)"/g;
  let m: RegExpExecArray | null;
  while ((m = idRe.exec(rels))) nextRel = Math.max(nextRel, parseInt(m[1], 10) + 1);

  // One <p:embeddedFont> per typeface, carrying its regular and/or bold slot.
  const byTypeface = new Map<string, { regular?: string; bold?: string }>();
  const relParts: string[] = [];

  faces.forEach((entry, i) => {
    const partName = "ppt/fonts/font" + (i + 1) + ".fntdata";
    zip.file(partName, fs.readFileSync(entry.file));

    const rid = "rId" + nextRel++;
    relParts.push(
      '<Relationship Id="' + rid +
        '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/font" Target="fonts/font' +
        (i + 1) + '.fntdata"/>'
    );

    const slot = byTypeface.get(entry.face.typeface) || {};
    slot[entry.face.slot] = rid;
    byTypeface.set(entry.face.typeface, slot);
    embedded.push(entry.face.typeface + " (" + entry.face.slot + ")");
  });

  let fontLst = "<p:embeddedFontLst>";
  byTypeface.forEach((slots, typeface) => {
    fontLst += '<p:embeddedFont><p:font typeface="' + xmlAttr(typeface) + '" pitchFamily="34" charset="0"/>';
    if (slots.regular) fontLst += '<p:regular r:id="' + slots.regular + '"/>';
    if (slots.bold) fontLst += '<p:bold r:id="' + slots.bold + '"/>';
    fontLst += "</p:embeddedFont>";
  });
  fontLst += "</p:embeddedFontLst>";

  // 1. relationships
  rels = rels.replace("</Relationships>", relParts.join("") + "</Relationships>");

  // 2. content types — keep Defaults grouped together
  if (types.indexOf('Extension="fntdata"') === -1) {
    const lastDefault = types.lastIndexOf("<Default ");
    const insertAt = types.indexOf("/>", lastDefault) + 2;
    types =
      types.slice(0, insertAt) +
      '<Default Extension="fntdata" ContentType="application/x-fontdata"/>' +
      types.slice(insertAt);
  }

  // 3. presentation.xml — the font list plus the two flags PowerPoint reads.
  if (presentation.indexOf("<p:embeddedFontLst>") === -1) {
    if (presentation.indexOf("<p:defaultTextStyle>") !== -1) {
      presentation = presentation.replace("<p:defaultTextStyle>", fontLst + "<p:defaultTextStyle>");
    } else {
      presentation = presentation.replace("</p:presentation>", fontLst + "</p:presentation>");
    }
  }
  presentation = presentation.replace(/\s*saveSubsetFonts="[^"]*"/, "");
  presentation = presentation.replace(
    "<p:presentation ",
    '<p:presentation embedTrueTypeFonts="1" saveSubsetFonts="0" '
  );

  zip.file(relsName, rels);
  zip.file("ppt/presentation.xml", presentation);
  zip.file("[Content_Types].xml", types);

  const buffer = await zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });
  return { buffer, embedded, warnings };
}

function xmlAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
