/**
 * Rating engine — pure, framework-agnostic math for the review system.
 * Stars are floats in [1.0, 5.0]; aggregates are floats in [0.0, 5.0].
 * A cook/meal with zero reviews always yields 0.0 (never NaN).
 */

export const MIN_STARS = 1.0;
export const MAX_STARS = 5.0;

/** Clamp a raw star value into the legal [1.0, 5.0] range. */
export function clampStars(stars: number): number {
  if (!Number.isFinite(stars)) return MIN_STARS;
  return Math.min(MAX_STARS, Math.max(MIN_STARS, stars));
}

/**
 * Average a list of star ratings. Empty input returns 0.0 — the UI treats
 * that as "no ratings yet" rather than a genuine zero score.
 */
export function computeAverage(stars: number[]): number {
  const valid = stars.filter((s) => Number.isFinite(s));
  if (valid.length === 0) return 0.0;
  const sum = valid.reduce((acc, s) => acc + clampStars(s), 0);
  return sum / valid.length;
}

/** Round an aggregate to one decimal for display (4.6667 -> 4.7). */
export function roundRating(avg: number): number {
  if (!Number.isFinite(avg)) return 0.0;
  return Math.round(avg * 10) / 10;
}

/** "4.7" or "New" when there are no reviews yet. */
export function formatRating(avg: number, count: number): string {
  if (count <= 0) return "New";
  return roundRating(avg).toFixed(1);
}

/**
 * Histogram of ratings bucketed by whole star (1..5), for review breakdown
 * bars. Half-stars round up into the nearer whole bucket (4.5 -> 5).
 */
export function ratingDistribution(stars: number[]): Record<1 | 2 | 3 | 4 | 5, number> {
  const dist: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const s of stars) {
    if (!Number.isFinite(s)) continue;
    const bucket = Math.min(5, Math.max(1, Math.round(clampStars(s)))) as 1 | 2 | 3 | 4 | 5;
    dist[bucket] += 1;
  }
  return dist;
}
