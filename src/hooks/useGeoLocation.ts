"use client";

import { useEffect, useState } from "react";
import type { LatLng } from "@/services/geo";
import { MARKET_CENTER } from "@/services/market";

/** Falls back to the mock market's center (see services/market). */
export const DEFAULT_CENTER: LatLng = MARKET_CENTER;

export type GeoStatus = "idle" | "locating" | "granted" | "denied" | "unavailable";

/**
 * Browser geolocation with a graceful fallback: until (or unless) the user
 * grants permission, `position` is the mock-data city center so the map and
 * distance labels always render something sensible.
 */
export function useGeoLocation() {
  const [position, setPosition] = useState<LatLng>(DEFAULT_CENTER);
  const [status, setStatus] = useState<GeoStatus>("idle");

  useEffect(() => {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setStatus("unavailable");
      return;
    }
    setStatus("locating");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus("granted");
      },
      () => setStatus("denied"),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 }
    );
  }, []);

  return { position, status, isReal: status === "granted" };
}
