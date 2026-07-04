"use client";

import { useMemo } from "react";
import { useFetch } from "./useFetch";
import type { CookCardData } from "@/components/CookCard";
import type { CookMarker } from "@/components/MapView";

/**
 * Shared cooks query — a single source for every view that renders
 * kitchens (home rails, full-screen map, dashboards) so pages never
 * duplicate fetch or marker-projection logic.
 */
export function useCooks() {
  const { data, error, loading, refetch } = useFetch<{ cooks: CookCardData[] }>("/api/cooks");
  const cooks = useMemo(() => data?.cooks ?? [], [data]);
  return { cooks, error, loading, refetch };
}

/** Project cook profiles into the map's marker shape. */
export function toCookMarkers(cooks: CookCardData[]): CookMarker[] {
  return cooks.map((c) => ({
    id: c.id,
    kitchenName: c.kitchenName,
    lat: c.location.lat,
    lng: c.location.lng,
    ratingAvg: c.ratingAvg,
    ratingCount: c.ratingCount,
    activeMeals: c.activeMeals,
  }));
}
