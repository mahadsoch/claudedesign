import { putImage, getImage } from "./db";
import { uid } from "@/lib/model/deck";

// Image field values are one of:
//   - "blob:<key>"  → uploaded blob stored in IndexedDB (resolved to objectURL)
//   - http(s)/data:/"/…"  → used as-is
// We keep a memo of created object URLs so repeated resolves are cheap and we
// don't leak URLs on every render.

const BLOB_PREFIX = "blob:";
const urlCache = new Map<string, string>();

/** Downscale + store an uploaded file; returns its "blob:<key>" ref. */
export async function storeUpload(file: File): Promise<string> {
  const blob = await downscale(file, 2560);
  const key = uid("img");
  await putImage(key, blob);
  urlCache.set(key, URL.createObjectURL(blob));
  return BLOB_PREFIX + key;
}

/** Resolve a field ref to a usable <img src>. Async because blobs come from IDB. */
export async function resolveImageAsync(ref: string | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  if (!ref.startsWith(BLOB_PREFIX)) return ref;
  const key = ref.slice(BLOB_PREFIX.length);
  if (urlCache.has(key)) return urlCache.get(key);
  const blob = await getImage(key);
  if (!blob) return undefined;
  const url = URL.createObjectURL(blob);
  urlCache.set(key, url);
  return url;
}

/** Synchronous resolve from cache (for render). Returns undefined until warmed. */
export function resolveImageSync(ref: string | undefined): string | undefined {
  if (!ref) return undefined;
  if (!ref.startsWith(BLOB_PREFIX)) return ref;
  return urlCache.get(ref.slice(BLOB_PREFIX.length));
}

/** Inline a ref to a base64 data URL — used before sending a deck to the PDF route. */
export async function inlineImage(ref: string | undefined): Promise<string | undefined> {
  if (!ref) return undefined;
  if (!ref.startsWith(BLOB_PREFIX)) return ref;
  const blob = await getImage(ref.slice(BLOB_PREFIX.length));
  if (!blob) return undefined;
  return await blobToDataURL(blob);
}

function blobToDataURL(blob: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = rej;
    r.readAsDataURL(blob);
  });
}

/** Resize so the longest edge ≤ max, re-encode as JPEG/PNG. Keeps PDFs lean. */
async function downscale(file: File, max: number): Promise<Blob> {
  if (!file.type.startsWith("image/")) return file;
  const bitmap = await createImageBitmap(file).catch(() => null);
  if (!bitmap) return file;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) return file;
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const cx = canvas.getContext("2d")!;
  cx.drawImage(bitmap, 0, 0, w, h);
  const type = file.type === "image/png" ? "image/png" : "image/jpeg";
  return await new Promise<Blob>((res) =>
    canvas.toBlob((b) => res(b ?? file), type, 0.9)
  );
}
