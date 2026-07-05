"use client";

import { Clock, MapPin, Plus } from "lucide-react";
import { useOrder } from "@/context/OrderContext";
import { RatingStars } from "./RatingStars";

export interface MealCardData {
  id: string;
  title: string;
  description: string;
  price: number;
  prepMinutes: number;
  image: string;
  photos?: string[];
  tags: string[];
  servingsLeft: number;
  available: boolean;
  ratingAvg: number;
  ratingCount: number;
  cookId: string;
  kitchenName: string;
  cuisines?: string[];
  distanceLabel?: string;
}

/**
 * Interactive meal card — hover lift + image zoom, price tag, dietary
 * labels, cook time. The card opens the home cook's Quick View sheet
 * (stretched button), while the corner button starts an order directly.
 */
export function MealCard({
  meal,
  onQuickView,
}: {
  meal: MealCardData;
  onQuickView: (cookId: string) => void;
}) {
  const { requestOrder, canOrder } = useOrder();
  const orderable = canOrder && meal.available && meal.servingsLeft > 0;

  return (
    <article className="group relative flex flex-col overflow-hidden rounded-md border border-zinc-200 bg-white text-left shadow-sm transition-all duration-200 focus-within:outline-2 focus-within:outline-accent-600 hover:-translate-y-0.5 hover:shadow-lg">
      {/* Stretched hit area — the whole card opens the kitchen quick view */}
      <button
        type="button"
        onClick={() => onQuickView(meal.cookId)}
        aria-label={`View ${meal.kitchenName}`}
        className="absolute inset-0 z-10 cursor-pointer focus:outline-none"
      />

      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={meal.image}
          alt={meal.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
        />
        <span className="absolute right-2.5 top-2.5 rounded-sm border border-zinc-200 bg-white px-2 py-1 text-sm font-semibold text-zinc-900 shadow-sm">
          ${meal.price.toFixed(2)}
        </span>
        {!meal.available && (
          <>
            <span className="absolute inset-0 bg-white/55" />
            <span className="absolute left-2.5 top-2.5 rounded-sm bg-zinc-900 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-white">
              Sold out
            </span>
          </>
        )}
        {meal.available && meal.servingsLeft > 0 && meal.servingsLeft <= 3 && (
          <span className="absolute left-2.5 top-2.5 rounded-sm bg-accent-600 px-2 py-1 text-xs font-semibold text-white">
            {meal.servingsLeft} left
          </span>
        )}
        {orderable && (
          <button
            type="button"
            onClick={() =>
              requestOrder({
                mealId: meal.id,
                title: meal.title,
                price: meal.price,
                image: meal.image,
                servingsLeft: meal.servingsLeft,
                prepMinutes: meal.prepMinutes,
                kitchenName: meal.kitchenName,
              })
            }
            aria-label={`Order ${meal.title}`}
            title={`Order ${meal.title}`}
            className="absolute bottom-2.5 right-2.5 z-20 flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-700 shadow-md transition-colors hover:border-accent-600 hover:bg-accent-600 hover:text-white focus-visible:outline-2 focus-visible:outline-accent-600"
          >
            <Plus size={16} />
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3.5">
        <h3 className="font-semibold leading-snug text-zinc-900">{meal.title}</h3>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-zinc-500">
          <RatingStars avg={meal.ratingAvg} count={meal.ratingCount} size={13} />
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {meal.prepMinutes} min
          </span>
          {meal.distanceLabel && (
            <span className="inline-flex items-center gap-1">
              <MapPin size={13} />
              {meal.distanceLabel}
            </span>
          )}
        </div>
        <p className="text-[13px] font-medium text-zinc-500">{meal.kitchenName}</p>
        {meal.tags.length > 0 && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1.5">
            {meal.tags.map((t) => (
              <span
                key={t}
                className="rounded-sm border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
