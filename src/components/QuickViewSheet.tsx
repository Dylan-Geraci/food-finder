"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowRight, BadgeCheck, Clock, Heart, MapPin, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { Avatar } from "./Avatar";
import { RatingStars } from "./RatingStars";

interface QuickViewData {
  cook: {
    id: string;
    kitchenName: string;
    bio: string;
    portrait: string;
    banner: string;
    icon: string;
    location: { lat: number; lng: number; label: string };
    certifications: { name: string; status: "verified" | "pending"; expiresOn: string }[];
    cuisines: string[];
    ratingAvg: number;
    ratingCount: number;
    cookName: string;
  };
  meals: {
    id: string;
    title: string;
    price: number;
    prepMinutes: number;
    image: string;
    available: boolean;
    servingsLeft: number;
    ratingAvg: number;
    ratingCount: number;
  }[];
}

/**
 * Quick View — side sheet on desktop, bottom drawer on mobile.
 * Shows the home cook's profile summary and menu without leaving the grid.
 */
export function QuickViewSheet({
  cookId,
  onClose,
}: {
  cookId: string | null;
  onClose: () => void;
}) {
  const { data, loading } = useFetch<QuickViewData>(
    cookId ? `/api/cooks/${cookId}` : null
  );
  const { user, toggleFavorite } = useAuth();
  const open = cookId !== null;
  const isFavorite = !!cookId && !!user?.favoriteCookIds.includes(cookId);

  // Lock body scroll while open; close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  const cook = data?.cook;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
      <button
        aria-label="Close quick view"
        className="absolute inset-0 bg-zinc-950/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85dvh] flex-col overflow-hidden rounded-t-lg border-t border-zinc-200 bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-[430px] sm:rounded-none sm:border-l sm:border-t-0">
        {/* Drag handle (mobile) + close */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-3.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Kitchen profile
          </span>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading || !cook ? (
            <div className="space-y-3">
              <div className="h-14 w-14 animate-pulse rounded-md bg-zinc-100" />
              <div className="h-5 w-2/3 animate-pulse rounded-sm bg-zinc-100" />
              <div className="h-4 w-1/2 animate-pulse rounded-sm bg-zinc-100" />
              <div className="h-20 animate-pulse rounded-sm bg-zinc-100" />
            </div>
          ) : (
            <>
              {cook.banner && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cook.banner}
                  alt={`${cook.kitchenName} banner`}
                  className="mb-4 h-28 w-full rounded-md border border-zinc-200 object-cover"
                />
              )}
              <div className="flex items-start gap-3.5">
                {cook.icon || cook.portrait ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={cook.icon || cook.portrait}
                    alt={cook.icon ? `${cook.kitchenName} icon` : cook.cookName}
                    className="h-16 w-16 shrink-0 rounded-md border border-zinc-100 object-cover"
                  />
                ) : (
                  <Avatar name={cook.kitchenName} size="xl" tone="accent" />
                )}
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-bold leading-tight text-zinc-900">
                    {cook.kitchenName}
                  </h2>
                  <p className="text-sm text-zinc-500">by {cook.cookName}</p>
                  <div className="mt-1.5">
                    <RatingStars avg={cook.ratingAvg} count={cook.ratingCount} />
                  </div>
                </div>
                {user?.role === "diner" && (
                  <button
                    onClick={() => toggleFavorite(cook.id)}
                    aria-label={isFavorite ? "Remove from saved kitchens" : "Save kitchen"}
                    title={isFavorite ? "Remove from saved kitchens" : "Save kitchen"}
                    className={`rounded-md border p-2 transition-colors ${
                      isFavorite
                        ? "border-accent-600 bg-accent-50 text-accent-600"
                        : "border-zinc-200 text-zinc-400 hover:border-zinc-300 hover:text-zinc-600"
                    }`}
                  >
                    <Heart size={16} className={isFavorite ? "fill-accent-600" : ""} />
                  </button>
                )}
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-sm text-zinc-500">
                <MapPin size={14} className="text-accent-600" />
                {cook.location.label}
              </p>

              <p className="mt-3 text-sm leading-relaxed text-zinc-600">{cook.bio}</p>

              <div className="mt-4 flex flex-wrap gap-1.5">
                {cook.cuisines.map((c) => (
                  <span
                    key={c}
                    className="rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700"
                  >
                    {c}
                  </span>
                ))}
              </div>

              <ul className="mt-4 space-y-1.5">
                {cook.certifications.map((cert) => (
                  <li
                    key={cert.name}
                    className={`flex items-center gap-1.5 text-[13px] font-medium ${
                      cert.status === "verified" ? "text-emerald-700" : "text-amber-700"
                    }`}
                  >
                    {cert.status === "verified" ? (
                      <BadgeCheck size={15} />
                    ) : (
                      <Clock size={15} />
                    )}
                    {cert.name}
                    <span className="font-normal text-zinc-400">
                      {cert.status === "verified" ? "· verified" : "· pending"}
                    </span>
                  </li>
                ))}
              </ul>

              <h3 className="mt-6 mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">
                Menu ({data.meals.length})
              </h3>
              <ul className="space-y-2.5">
                {data.meals.map((m) => (
                  <li
                    key={m.id}
                    className={`flex items-center gap-3 rounded-md border border-zinc-200 p-2.5 ${
                      m.available ? "" : "opacity-55"
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={m.image}
                      alt={m.title}
                      loading="lazy"
                      className="h-14 w-14 shrink-0 rounded-sm object-cover"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-900">
                        {m.title}
                      </p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500">
                        <span className="font-semibold text-zinc-900">
                          ${m.price.toFixed(2)}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock size={11} />
                          {m.prepMinutes} min
                        </span>
                        {!m.available && (
                          <span className="font-semibold uppercase text-zinc-400">
                            Sold out
                          </span>
                        )}
                      </p>
                    </div>
                    <RatingStars
                      avg={m.ratingAvg}
                      count={m.ratingCount}
                      size={11}
                      showCount={false}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        {cook && (
          <div className="border-t border-zinc-200 p-4">
            <Link
              href={`/cooks/${cook.id}`}
              className="flex w-full items-center justify-center gap-2 rounded-md bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
            >
              View full kitchen
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
