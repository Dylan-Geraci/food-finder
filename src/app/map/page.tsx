"use client";

import dynamic from "next/dynamic";
import { LocateFixed, MapPin } from "lucide-react";
import { toCookMarkers, useCooks } from "@/hooks/useCooks";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { MARKET_NAME } from "@/services/market";

// MapLibre touches `window`; skip SSR for the map itself.
const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-400">
      Loading map...
    </div>
  ),
});

/**
 * Full-screen map. Populated on load: kitchen markers are dropped from the
 * seeded coordinates as soon as the cooks query resolves — no address entry
 * or user action required.
 */
export default function MapPage() {
  const { cooks } = useCooks();
  const { position, isReal, status } = useGeoLocation();
  const markers = toCookMarkers(cooks);

  return (
    // Tailwind calc values need `_` separators around operators — without
    // them the utility is silently dropped and this main collapses to 0
    // height, clipping the (fully populated) map out of view. Mobile also
    // subtracts the 4rem bottom tab bar so the map fits exactly.
    <main className="flex h-[calc(100dvh_-_3.5rem_-_4rem)] flex-col md:h-[calc(100dvh_-_3.5rem)]">
      <header className="border-b border-zinc-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div>
            <h1 className="font-bold tracking-tight text-zinc-900">Kitchens near you</h1>
            <p className="flex items-center gap-1.5 text-xs text-zinc-500">
              <MapPin size={12} className="text-accent-600" />
              {markers.length} active kitchen{markers.length === 1 ? "" : "s"} mapped
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-zinc-50 px-2.5 py-1.5 text-xs font-medium text-zinc-600">
            <LocateFixed size={13} className={isReal ? "text-emerald-600" : "text-zinc-400"} />
            {isReal
              ? "Your location"
              : status === "locating"
                ? "Locating..."
                : MARKET_NAME}
          </span>
        </div>
      </header>
      <div className="relative flex-1">
        <MapView
          markers={markers}
          center={position}
          userPosition={isReal ? position : null}
          className="absolute inset-0"
        />
      </div>
    </main>
  );
}
