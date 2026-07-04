"use client";

import { useId, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { fileToCompressedDataUrl } from "@/services/media";

/**
 * Drag-and-drop photo intake — a dashed drop zone that becomes a preview
 * with replace/remove controls. Files are downscaled in the browser before
 * they ever leave the client (see services/media). Deliberately not an
 * image editor: one file in, one compressed photo out.
 */
export function MediaUpload({
  label,
  hint,
  value,
  onChange,
  maxDim = 1200,
  quality,
  aspectClass = "aspect-[4/3]",
  className = "",
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (dataUrl: string) => void;
  maxDim?: number;
  quality?: number;
  aspectClass?: string;
  className?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function intake(file: File | undefined) {
    if (!file || busy) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await fileToCompressedDataUrl(file, { maxDim, quality }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't process that image.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={className}>
      <span className="mb-1.5 block text-sm font-medium text-zinc-700">{label}</span>

      {value ? (
        <div
          className={`relative overflow-hidden rounded-md border border-zinc-200 bg-zinc-100 ${aspectClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <div className="absolute right-2 top-2 flex gap-1.5">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label={`Replace ${label.toLowerCase()}`}
              title="Replace photo"
              className="rounded-md border border-zinc-200 bg-white/95 p-1.5 text-zinc-600 shadow-sm transition-colors hover:text-zinc-900"
            >
              <ImagePlus size={14} />
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              aria-label={`Remove ${label.toLowerCase()}`}
              title="Remove photo"
              className="rounded-md border border-zinc-200 bg-white/95 p-1.5 text-zinc-600 shadow-sm transition-colors hover:border-red-300 hover:text-red-600"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            intake(e.dataTransfer.files?.[0]);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-4 text-center transition-colors ${aspectClass} ${
            dragging
              ? "border-accent-600 bg-accent-50"
              : "border-zinc-300 bg-zinc-50 hover:border-zinc-400"
          }`}
        >
          <ImagePlus size={18} className={dragging ? "text-accent-600" : "text-zinc-400"} />
          <span className="text-xs font-medium text-zinc-600">
            {busy ? "Processing..." : "Drop a photo or click to browse"}
          </span>
          {hint && <span className="text-[11px] text-zinc-400">{hint}</span>}
        </label>
      )}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => intake(e.target.files?.[0])}
      />
      {error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
    </div>
  );
}
