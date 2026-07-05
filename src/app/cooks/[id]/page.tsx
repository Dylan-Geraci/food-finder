"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft, CalendarClock, Clock, MapPin } from "lucide-react";
import { useFetch } from "@/hooks/useFetch";
import { Avatar } from "@/components/Avatar";
import { RatingStars } from "@/components/RatingStars";
import { ReviewForm } from "@/components/ReviewForm";
import { ReviewList, type ReviewData } from "@/components/ReviewList";
import { formatRating } from "@/services/rating";

interface CookDetail {
  cook: {
    id: string;
    kitchenName: string;
    bio: string;
    portrait: string;
    banner: string;
    icon: string;
    location: { lat: number; lng: number; label: string };
    operatingHours: { day: string; open: string; close: string; closed: boolean }[];
    cuisines: string[];
    ratingAvg: number;
    ratingCount: number;
    cookName: string;
  };
  meals: {
    id: string;
    title: string;
    description: string;
    price: number;
    prepMinutes: number;
    image: string;
    photos: string[];
    tags: string[];
    servingsLeft: number;
    available: boolean;
    ratingAvg: number;
    ratingCount: number;
  }[];
  reviews: ReviewData[];
}

export default function CookProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { data, loading, error, refetch } = useFetch<CookDetail>(`/api/cooks/${id}`);

  if (loading) {
    return (
      <p className="py-24 text-center text-sm text-zinc-400">Loading kitchen...</p>
    );
  }
  if (error || !data?.cook) {
    return (
      <div className="space-y-3 py-24 text-center">
        <p className="text-sm text-zinc-500">Couldn&apos;t load this kitchen.</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-accent-600"
        >
          <ArrowLeft size={15} />
          Back to browse
        </Link>
      </div>
    );
  }

  const { cook, meals, reviews } = data;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900"
      >
        <ArrowLeft size={15} />
        Browse
      </Link>

      {/* Banner — wide kitchen hero, when the kitchen has uploaded one */}
      {cook.banner && (
        <div className="mt-4 overflow-hidden rounded-md border border-zinc-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={cook.banner}
            alt={`${cook.kitchenName} banner`}
            className="h-40 w-full object-cover sm:h-56"
          />
        </div>
      )}

      {/* Header */}
      <header className={`${cook.banner ? "mt-3" : "mt-4"} rounded-md border border-zinc-200 bg-white p-5 shadow-sm`}>
        <div className="flex items-start gap-4">
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
            <h1 className="text-2xl font-extrabold leading-tight tracking-tight text-zinc-900">
              {cook.kitchenName}
            </h1>
            <p className="mt-0.5 text-sm text-zinc-500">
              by {cook.cookName}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-zinc-500">
              <MapPin size={13} className="text-accent-600" />
              {cook.location.label}
            </p>
            <div className="mt-2">
              <RatingStars avg={cook.ratingAvg} count={cook.ratingCount} size={15} />
            </div>
          </div>
        </div>

        <p className="mt-4 text-sm leading-relaxed text-zinc-600">{cook.bio}</p>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {cook.cuisines.map((c) => (
            <span
              key={c}
              className="rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-700"
            >
              {c}
            </span>
          ))}
        </div>

        {cook.operatingHours.length > 0 && (
          <div className="mt-4 border-t border-zinc-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <CalendarClock size={13} />
              Hours
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
              {cook.operatingHours.map((h) => (
                <div key={h.day} className="flex justify-between text-[13px]">
                  <span className="font-medium text-zinc-600">{h.day}</span>
                  <span className={h.closed ? "text-zinc-400" : "text-zinc-900"}>
                    {h.closed ? "Closed" : `${h.open}–${h.close}`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Menu */}
      <h2 className="mt-8 mb-3 text-lg font-bold tracking-tight text-zinc-900">
        Menu ({meals.length})
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {meals.map((m) => (
          <article
            key={m.id}
            className={`overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm ${
              m.available ? "" : "opacity-60"
            }`}
          >
            <div className="group relative aspect-[16/9] bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={m.photos[0] ?? m.image}
                alt={m.title}
                loading="lazy"
                className="h-full w-full object-cover"
              />
              {/* Second dish photo crossfades in on hover */}
              {m.photos[1] && (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.photos[1]}
                    alt={`${m.title} — second photo`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  />
                  <span className="absolute bottom-2 right-2 rounded-sm bg-zinc-900/80 px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-white">
                    2 PHOTOS
                  </span>
                </>
              )}
              <span className="absolute right-2 top-2 rounded-sm border border-zinc-200 bg-white px-2 py-0.5 text-sm font-semibold text-zinc-900 shadow-sm">
                ${m.price.toFixed(2)}
              </span>
              {!m.available && (
                <span className="absolute left-2 top-2 rounded-sm bg-zinc-900 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white">
                  Sold out
                </span>
              )}
            </div>
            <div className="p-3.5">
              <h3 className="font-semibold text-zinc-900">{m.title}</h3>
              <div className="mt-1 flex items-center gap-3 text-[13px] text-zinc-500">
                <RatingStars avg={m.ratingAvg} count={m.ratingCount} size={12} />
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  {m.prepMinutes} min
                </span>
              </div>
              <p className="mt-1.5 text-[13px] leading-relaxed text-zinc-500">
                {m.description}
              </p>
              {m.tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {m.tags.map((t) => (
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
        ))}
      </div>

      {/* Reviews */}
      <div className="mt-10 flex items-end justify-between">
        <h2 className="text-lg font-bold tracking-tight text-zinc-900">Reviews</h2>
        <p className="text-sm text-zinc-500">
          <span className="text-base font-bold text-zinc-900">
            {formatRating(cook.ratingAvg, cook.ratingCount)}
          </span>
          {cook.ratingCount > 0 && ` from ${cook.ratingCount} reviews`}
        </p>
      </div>
      <div className="mt-3 space-y-4">
        <ReviewForm
          meals={meals.map((m) => ({ id: m.id, title: m.title }))}
          onSubmitted={refetch}
        />
        <ReviewList reviews={reviews} />
      </div>
    </main>
  );
}
