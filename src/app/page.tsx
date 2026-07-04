"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { ArrowRight, LogIn, MapPin, Search, ShieldCheck, Star, Store, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MealCard, type MealCardData } from "@/components/MealCard";
import { CookCard, type CookCardData } from "@/components/CookCard";
import { QuickViewSheet } from "@/components/QuickViewSheet";
import type { CookMarker } from "@/components/MapView";
import { useFetch } from "@/hooks/useFetch";
import { useGeoLocation } from "@/hooks/useGeoLocation";
import { distanceKm, formatDistance } from "@/services/geo";
import { computeAverage, roundRating } from "@/services/rating";

const MapView = dynamic(() => import("@/components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-zinc-100 text-sm text-zinc-400">
      Loading map...
    </div>
  ),
});

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=70";

type MealWithLocation = MealCardData & {
  location: { lat: number; lng: number; label: string } | null;
  cuisines: string[];
};

export default function LandingPage() {
  const { data: mealData, loading: mealsLoading } =
    useFetch<{ meals: MealWithLocation[] }>("/api/meals");
  const { data: cookData } = useFetch<{ cooks: CookCardData[] }>("/api/cooks");
  const { position, isReal, status } = useGeoLocation();
  const { status: authStatus, openAuth } = useAuth();

  const [category, setCategory] = useState("All");
  const [address, setAddress] = useState("");
  const [quickViewCookId, setQuickViewCookId] = useState<string | null>(null);

  const meals = useMemo(() => {
    if (!mealData?.meals) return [];
    return mealData.meals.map((m) => ({
      ...m,
      distanceLabel: m.location
        ? formatDistance(distanceKm(position, m.location))
        : undefined,
    }));
  }, [mealData, position]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    meals.forEach((m) => m.cuisines.forEach((c) => set.add(c)));
    return ["All", ...[...set].sort()];
  }, [meals]);

  const filtered = useMemo(
    () =>
      category === "All" ? meals : meals.filter((m) => m.cuisines.includes(category)),
    [meals, category]
  );

  const cooks = useMemo(() => {
    if (!cookData?.cooks) return [];
    return [...cookData.cooks]
      .map((c) => ({
        ...c,
        distanceLabel: formatDistance(distanceKm(position, c.location)),
      }))
      .sort(
        (a, b) => distanceKm(position, a.location) - distanceKm(position, b.location)
      );
  }, [cookData, position]);

  const markers: CookMarker[] = cooks.map((c) => ({
    id: c.id,
    kitchenName: c.kitchenName,
    lat: c.location.lat,
    lng: c.location.lng,
    ratingAvg: c.ratingAvg,
    ratingCount: c.ratingCount,
    activeMeals: c.activeMeals,
  }));

  const marketAvg = roundRating(
    computeAverage(cooks.filter((c) => c.ratingCount > 0).map((c) => c.ratingAvg))
  );

  function onSearch(e: React.FormEvent) {
    e.preventDefault();
    document.getElementById("meals")?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <main>
      {/* ---------- Hero ---------- */}
      <section className="border-b border-zinc-200 bg-zinc-50">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 md:grid-cols-2 md:py-16">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent-600">
              Hyper-local home cooking
            </p>
            <h1 className="mt-3 text-4xl font-extrabold leading-[1.08] tracking-tight text-zinc-900 sm:text-5xl">
              Real meals, made
              <br />
              in real kitchens
              <br />
              near you.
            </h1>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-zinc-500">
              Skip the marketplace clutter. FableFare is built for one thing:
              connecting you with certified home cooks in your neighborhood.
            </p>

            <form onSubmit={onSearch} className="mt-7 flex max-w-md gap-2">
              <label className="flex flex-1 items-center gap-2 rounded-md border border-zinc-300 bg-white px-3 focus-within:border-accent-600">
                <MapPin size={16} className="shrink-0 text-zinc-400" />
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={isReal ? "Using your current location" : "Enter your address"}
                  className="w-full bg-transparent py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
              >
                <Search size={15} />
                Find meals
              </button>
            </form>

            {authStatus === "guest" && (
              <div className="mt-4 flex max-w-md items-center gap-2">
                <button
                  onClick={() => openAuth("signup")}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-900 bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
                >
                  <UserPlus size={15} />
                  Create an account
                </button>
                <button
                  onClick={() => openAuth("login")}
                  className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
                >
                  <LogIn size={15} />
                  Log in
                </button>
              </div>
            )}

            <dl className="mt-8 flex flex-wrap gap-x-8 gap-y-3">
              <div className="flex items-center gap-2">
                <Store size={17} className="text-accent-600" />
                <dd className="text-sm text-zinc-600">
                  <span className="font-bold text-zinc-900">{cooks.length || "—"}</span>{" "}
                  active kitchens
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <Star size={17} className="text-accent-600" />
                <dd className="text-sm text-zinc-600">
                  <span className="font-bold text-zinc-900">
                    {marketAvg > 0 ? marketAvg.toFixed(1) : "—"}
                  </span>{" "}
                  avg kitchen rating
                </dd>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck size={17} className="text-accent-600" />
                <dd className="text-sm text-zinc-600">Food-handler certified</dd>
              </div>
            </dl>
          </div>

          <div className="relative hidden md:block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={HERO_IMAGE}
              alt="Home-cooked meal plated for pickup"
              className="h-[380px] w-full rounded-md object-cover shadow-xl"
            />
            <div className="absolute -bottom-4 -left-4 rounded-md border border-zinc-200 bg-white px-4 py-3 shadow-lg">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                Tonight near you
              </p>
              <p className="text-sm font-bold text-zinc-900">
                {meals.filter((m) => m.available).length || "—"} meals available
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- Category filters ----------
          Sticky at top:0 — the navbar scrolls away with the page, so the
          filter bar locks flush to the viewport edge with no dead gap.
          z-40 keeps it above the meal grid and the (isolated) map canvas. */}
      <section className="sticky top-0 z-40 border-b border-zinc-200 bg-white">
        <div className="rail mx-auto flex max-w-7xl gap-2 overflow-x-auto px-4 py-3 sm:px-6">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`shrink-0 rounded-md px-3.5 py-1.5 text-sm font-medium transition-colors ${
                category === c
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-900"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Meal grid ---------- */}
      <section id="meals" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-5 flex items-end justify-between">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              Available near you
            </h2>
            <p className="text-sm text-zinc-500">
              {filtered.length} meal{filtered.length === 1 ? "" : "s"}
              {category !== "All" ? ` in ${category}` : ""} &middot;{" "}
              {isReal
                ? "distances from your location"
                : status === "locating"
                  ? "locating you..."
                  : "showing Austin, TX"}
            </p>
          </div>
        </div>

        {mealsLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-md border border-zinc-200">
                <div className="aspect-[4/3] animate-pulse bg-zinc-100" />
                <div className="space-y-2 p-3.5">
                  <div className="h-4 w-3/4 animate-pulse rounded-sm bg-zinc-100" />
                  <div className="h-3 w-1/2 animate-pulse rounded-sm bg-zinc-100" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((meal) => (
              <MealCard key={meal.id} meal={meal} onQuickView={setQuickViewCookId} />
            ))}
          </div>
        )}
      </section>

      {/* ---------- Kitchens rail ---------- */}
      <section className="border-t border-zinc-200 bg-zinc-50 py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h2 className="mb-4 text-xl font-bold tracking-tight text-zinc-900">
            Kitchens near you
          </h2>
          <div className="rail flex gap-4 overflow-x-auto pb-1">
            {cooks.map((cook) => (
              <CookCard key={cook.id} cook={cook} onQuickView={setQuickViewCookId} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------- Map band ---------- */}
      <section className="border-t border-zinc-200">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-5 lg:gap-10">
          <div className="lg:col-span-2">
            <h2 className="text-xl font-bold tracking-tight text-zinc-900">
              Explore the neighborhood
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
              Every active kitchen, mapped the moment you land. Pins show live
              ratings pulled straight from the review engine.
            </p>
            <Link
              href="/map"
              className="mt-5 inline-flex items-center gap-2 rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
            >
              Open full map
              <ArrowRight size={16} />
            </Link>
          </div>
          {/* `isolate` traps MapLibre's internal z-indexes in their own
              stacking context so the canvas/controls can never paint over
              the sticky filter bar during fast scrolling. */}
          <div className="isolate z-0 mt-6 h-72 overflow-hidden rounded-md border border-zinc-200 lg:col-span-3 lg:mt-0 lg:h-80">
            <MapView
              markers={markers}
              center={position}
              userPosition={isReal ? position : null}
              interactivePopups
            />
          </div>
        </div>
      </section>

      {/* ---------- Footer ---------- */}
      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-6 text-sm text-zinc-400 sm:flex-row sm:px-6">
          <span className="font-semibold text-zinc-500">
            Fable<span className="text-accent-600">Fare</span>
          </span>
          <span>Home-cooked meal marketplace MVP &middot; Austin, TX</span>
        </div>
      </footer>

      <QuickViewSheet
        cookId={quickViewCookId}
        onClose={() => setQuickViewCookId(null)}
      />
    </main>
  );
}
