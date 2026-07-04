import type { LatLng } from "./geo";

/**
 * Marketplace region constants — the mock market spans Orange County and
 * Los Angeles. `MARKET_CENTER` doubles as the geolocation fallback and the
 * jitter origin for brand-new kitchen signups; keep it in sync with the
 * `city` block in db/mock-data.json.
 */
export const MARKET_NAME = "Los Angeles, CA";
export const MARKET_CENTER: LatLng = { lat: 33.7701, lng: -118.1937 };
