"use client";

import { Star } from "lucide-react";
import { roundRating } from "@/services/rating";

/**
 * Crisp, uniform star metrics. Fractional averages render via a
 * percentage-clipped overlay; zero reviews render a neutral "New" chip
 * (the rating engine guarantees 0.0, never NaN).
 */

function StarRow({ size, filled }: { size: number; filled: boolean }) {
  return (
    <span className="flex gap-px">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star
          key={i}
          size={size}
          strokeWidth={0}
          className={filled ? "fill-amber-500" : "fill-zinc-200"}
        />
      ))}
    </span>
  );
}

export function RatingStars({
  avg,
  count,
  size = 14,
  showCount = true,
}: {
  avg: number;
  count: number;
  size?: number;
  showCount?: boolean;
}) {
  const rounded = roundRating(avg);
  const pct = count > 0 ? Math.max(0, Math.min(100, (rounded / 5) * 100)) : 0;

  if (count <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5">
        <span className="relative inline-flex" aria-hidden>
          <StarRow size={size} filled={false} />
        </span>
        <span className="rounded-sm bg-zinc-100 px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
          New
        </span>
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5"
      aria-label={`Rated ${rounded.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <span className="relative inline-flex" aria-hidden>
        <StarRow size={size} filled={false} />
        <span
          className="absolute inset-y-0 left-0 overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          <StarRow size={size} filled />
        </span>
      </span>
      <span className="text-sm font-semibold leading-none text-zinc-900">
        {rounded.toFixed(1)}
      </span>
      {showCount && <span className="text-sm leading-none text-zinc-400">({count})</span>}
    </span>
  );
}

/** Interactive picker for review submission — half-star steps. */
export function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (stars: number) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const fillPct = value >= star ? 100 : value >= star - 0.5 ? 50 : 0;
          return (
            <span key={star} className="relative inline-flex">
              <Star size={28} strokeWidth={0} className="fill-zinc-200" />
              <span
                className="absolute inset-y-0 left-0 overflow-hidden pointer-events-none"
                style={{ width: `${fillPct}%` }}
              >
                <Star size={28} strokeWidth={0} className="fill-amber-500" />
              </span>
              <button
                type="button"
                aria-label={`${star - 0.5} stars`}
                className="absolute inset-y-0 left-0 w-1/2"
                onClick={() => onChange(star - 0.5)}
              />
              <button
                type="button"
                aria-label={`${star} stars`}
                className="absolute inset-y-0 right-0 w-1/2"
                onClick={() => onChange(star)}
              />
            </span>
          );
        })}
      </div>
      <span className="text-lg font-semibold tabular-nums text-zinc-900">
        {value.toFixed(1)}
      </span>
    </div>
  );
}
