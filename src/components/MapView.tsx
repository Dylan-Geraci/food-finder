"use client";

import { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { LatLng } from "@/services/geo";
import { formatRating } from "@/services/rating";
import { initialsOf } from "./Avatar";

/**
 * OpenFreeMap integration — MapLibre GL with OpenFreeMap's free vector
 * tiles (no API key, no Google/Mapbox). The map is populated on load:
 * markers are synced from the seeded cook coordinates the moment they
 * arrive, with no user action required.
 */

const OPENFREEMAP_STYLE = "https://tiles.openfreemap.org/styles/liberty";

const STAR_SVG =
  '<svg width="11" height="11" viewBox="0 0 24 24" fill="#f59e0b" xmlns="http://www.w3.org/2000/svg"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14l-5-4.87 6.91-1.01z"/></svg>';

export interface CookMarker {
  id: string;
  kitchenName: string;
  lat: number;
  lng: number;
  ratingAvg: number;
  ratingCount: number;
  activeMeals: number;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
}

export default function MapView({
  markers,
  center,
  userPosition,
  className = "h-full w-full",
  interactivePopups = true,
}: {
  markers: CookMarker[];
  center: LatLng;
  userPosition?: LatLng | null;
  className?: string;
  interactivePopups?: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRefs = useRef<maplibregl.Marker[]>([]);

  // Create the map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: OPENFREEMAP_STYLE,
      center: [center.lng, center.lat],
      zoom: 12,
      attributionControl: { compact: true },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    mapRef.current = map;
    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Populate/sync kitchen markers as soon as coordinates are available
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    markerRefs.current.forEach((m) => m.remove());
    markerRefs.current = [];

    for (const cook of markers) {
      const el = document.createElement("div");
      el.style.cssText =
        "display:flex;align-items:center;gap:6px;background:#ffffff;border:1px solid #d4d4d8;" +
        "border-radius:6px;padding:3px 8px 3px 3px;box-shadow:0 4px 14px rgba(24,24,27,0.18);cursor:pointer";
      el.innerHTML =
        `<span style="display:flex;align-items:center;justify-content:center;width:24px;height:24px;` +
        `background:#18181b;color:#fff;border-radius:4px;font:600 10px/1 var(--font-sans),sans-serif;letter-spacing:0.03em">` +
        `${escapeHtml(initialsOf(cook.kitchenName))}</span>` +
        `<span style="display:flex;align-items:center;gap:3px;font:600 12px/1 var(--font-sans),sans-serif;color:#18181b">` +
        `${STAR_SVG}${formatRating(cook.ratingAvg, cook.ratingCount)}</span>`;

      const marker = new maplibregl.Marker({ element: el, anchor: "bottom" }).setLngLat([
        cook.lng,
        cook.lat,
      ]);

      if (interactivePopups) {
        const popup = new maplibregl.Popup({ offset: 18, closeButton: false }).setHTML(`
          <a href="/cooks/${cook.id}" style="display:block;padding:12px 14px;text-decoration:none;color:#18181b;min-width:190px;font-family:var(--font-sans),sans-serif">
            <div style="font-weight:600;font-size:14px;margin-bottom:3px">${escapeHtml(cook.kitchenName)}</div>
            <div style="display:flex;align-items:center;gap:4px;font-size:12px;color:#71717a">
              ${STAR_SVG}
              <span style="font-weight:600;color:#18181b">${formatRating(cook.ratingAvg, cook.ratingCount)}</span>
              ${cook.ratingCount > 0 ? `(${cook.ratingCount})` : ""}
              <span style="color:#d4d4d8">|</span>
              ${cook.activeMeals} meal${cook.activeMeals === 1 ? "" : "s"} available
            </div>
            <div style="font-size:12px;color:#dd4c06;font-weight:600;margin-top:8px">View kitchen &rarr;</div>
          </a>
        `);
        marker.setPopup(popup);
      }

      marker.addTo(map);
      markerRefs.current.push(marker);
    }

    // Frame every kitchen automatically
    if (markers.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      markers.forEach((c) => bounds.extend([c.lng, c.lat]));
      if (userPosition) bounds.extend([userPosition.lng, userPosition.lat]);
      map.fitBounds(bounds, { padding: 60, maxZoom: 14, duration: 600 });
    }
  }, [markers, userPosition, interactivePopups]);

  // User position dot
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !userPosition) return;
    const el = document.createElement("div");
    el.style.cssText =
      "width:14px;height:14px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 5px rgba(37,99,235,0.22)";
    const marker = new maplibregl.Marker({ element: el })
      .setLngLat([userPosition.lng, userPosition.lat])
      .addTo(map);
    return () => {
      marker.remove();
    };
  }, [userPosition]);

  return <div ref={containerRef} className={className} />;
}
