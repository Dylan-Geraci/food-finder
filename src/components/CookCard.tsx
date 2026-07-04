"use client";

import { ChevronRight, MapPin } from "lucide-react";
import { Avatar } from "./Avatar";
import { RatingStars } from "./RatingStars";

export interface CookCardData {
  id: string;
  kitchenName: string;
  bio: string;
  cookName: string;
  portrait: string;
  banner: string;
  icon: string;
  cuisines: string[];
  ratingAvg: number;
  ratingCount: number;
  activeMeals: number;
  location: { lat: number; lng: number; label: string };
  distanceLabel?: string;
}

/** Compact kitchen card — opens the Quick View sheet. */
export function CookCard({
  cook,
  onQuickView,
}: {
  cook: CookCardData;
  onQuickView: (cookId: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onQuickView(cook.id)}
      className="flex w-72 shrink-0 items-center gap-3 rounded-md border border-zinc-200 bg-white p-3.5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-accent-600"
    >
      {cook.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={cook.icon}
          alt={`${cook.kitchenName} icon`}
          loading="lazy"
          className="h-14 w-14 shrink-0 rounded-md border border-zinc-100 object-cover"
        />
      ) : (
        <Avatar name={cook.kitchenName} size="lg" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-zinc-900">
          {cook.kitchenName}
        </span>
        <RatingStars avg={cook.ratingAvg} count={cook.ratingCount} size={12} />
        <span className="mt-0.5 flex items-center gap-1 truncate text-xs text-zinc-500">
          <MapPin size={11} className="shrink-0" />
          {cook.distanceLabel ? `${cook.distanceLabel} away` : cook.location.label}
          <span className="text-zinc-300">|</span>
          {cook.activeMeals} meal{cook.activeMeals === 1 ? "" : "s"}
        </span>
      </span>
      <ChevronRight size={16} className="shrink-0 text-zinc-400" />
    </button>
  );
}
