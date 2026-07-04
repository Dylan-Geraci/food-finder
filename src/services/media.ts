/**
 * Media intake helpers.
 *
 * Uploads are compressed in the browser (canvas downscale to JPEG) and
 * stored as data URLs in MongoDB — no file storage service required, and
 * the documents move unchanged to any hosted MongoDB later. Server routes
 * re-validate with `isMediaString`.
 */

/** Fallback dish photo for listings created without an upload. */
export const DEFAULT_MEAL_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=60";

/** Upper bound for a stored media string (post-compression data URL). */
export const MEDIA_MAX_CHARS = 2_000_000;

const MAX_INPUT_BYTES = 10 * 1024 * 1024;

/** True when a value is safe to store: empty, a data-URL image, or http(s). */
export function isMediaString(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= MEDIA_MAX_CHARS &&
    (value === "" || value.startsWith("data:image/") || /^https?:\/\//.test(value))
  );
}

export interface CompressOptions {
  /** Longest edge of the output image, in pixels. */
  maxDim: number;
  /** JPEG quality 0..1 (default 0.82). */
  quality?: number;
}

/** Browser-side: downscale an image file and return a JPEG data URL. */
export async function fileToCompressedDataUrl(
  file: File,
  { maxDim, quality = 0.82 }: CompressOptions
): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("Choose an image file (JPG, PNG, or WebP).");
  }
  if (file.size > MAX_INPUT_BYTES) {
    throw new Error("Image is larger than 10 MB — pick a smaller file.");
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error("That file couldn't be read as an image."));
      el.src = objectUrl;
    });

    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.max(1, Math.round(img.naturalWidth * scale));
    const height = Math.max(1, Math.round(img.naturalHeight * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Image processing isn't available in this browser.");
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL("image/jpeg", quality);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
