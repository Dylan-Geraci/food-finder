"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarClock,
  Check,
  ChefHat,
  ClipboardList,
  Clock,
  ListPlus,
  MapPin,
  MessageSquareText,
  Minus,
  PackageCheck,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { Avatar } from "@/components/Avatar";
import { MediaUpload } from "@/components/MediaUpload";
import { RatingStars } from "@/components/RatingStars";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";
import { ratingDistribution, roundRating } from "@/services/rating";

interface KitchenDetail {
  cook: {
    id: string;
    kitchenName: string;
    bio: string;
    portrait: string;
    banner: string;
    icon: string;
    location: { label: string };
    operatingHours: { day: string; open: string; close: string; closed: boolean }[];
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
    photos: string[];
    servingsLeft: number;
    available: boolean;
    ratingAvg: number;
    ratingCount: number;
  }[];
}

interface OrderRow {
  id: string;
  qty: number;
  total: number;
  type: string;
  status: string;
  placedAt: string;
  mealTitle: string;
  dinerName: string;
}

interface ReviewRow {
  id: string;
  stars: number;
}

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none";

function timeLabel(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${Math.max(1, mins)} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Kitchen dashboard — queue, listings (CRUD), hours, certs, rating analytics. */
export default function BusinessDashboardPage() {
  const { status, user } = useAuth();
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({ title: "", price: "", prepMinutes: "30", servings: "5", description: "" });
  const [newMealPhotos, setNewMealPhotos] = useState<[string, string]>(["", ""]);
  const [formError, setFormError] = useState<string | null>(null);

  // Guards: guests to the auth prompt, diner accounts to their own portal
  useEffect(() => {
    if (status === "guest") router.replace("/profile");
    if (status === "authed" && user?.role === "diner") router.replace("/profile/user");
  }, [status, user, router]);

  const cookId = status === "authed" && user?.role === "cook" ? user.cookProfileId : null;
  const { data: kitchen, refetch: refetchKitchen } = useFetch<KitchenDetail>(
    cookId ? `/api/cooks/${cookId}` : null
  );
  const { data: orderData, refetch: refetchOrders } = useFetch<{ orders: OrderRow[] }>(
    cookId ? `/api/orders?cookId=${cookId}` : null
  );
  const { data: reviewData } = useFetch<{ reviews: ReviewRow[] }>(
    cookId ? `/api/reviews?cookId=${cookId}` : null
  );

  if (!user || user.role !== "cook") {
    return <p className="py-24 text-center text-sm text-zinc-400">Loading dashboard...</p>;
  }
  if (!cookId) {
    return (
      <p className="py-24 text-center text-sm text-zinc-500">
        No kitchen profile is linked to this account.
      </p>
    );
  }

  const cook = kitchen?.cook;
  const meals = kitchen?.meals ?? [];
  const orders = orderData?.orders ?? [];
  const queue = orders.filter((o) => ["pending", "accepted", "ready"].includes(o.status));
  const history = orders.filter((o) => ["completed", "cancelled"].includes(o.status));
  const stars = (reviewData?.reviews ?? []).map((r) => r.stars);
  const dist = ratingDistribution(stars);
  const maxBucket = Math.max(1, ...Object.values(dist));

  async function patchOrder(id: string, next: string) {
    setBusyId(id);
    await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusyId(null);
    refetchOrders();
  }

  async function patchMeal(id: string, update: Record<string, unknown>) {
    setBusyId(id);
    await fetch(`/api/meals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
    });
    setBusyId(null);
    refetchKitchen();
  }

  async function deleteMeal(id: string, title: string) {
    if (!window.confirm(`Delete "${title}"? Its reviews are removed too.`)) return;
    setBusyId(id);
    await fetch(`/api/meals/${id}`, { method: "DELETE" });
    setBusyId(null);
    refetchKitchen();
  }

  async function addMeal(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    const res = await fetch("/api/meals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cookId,
        title: newMeal.title,
        price: Number(newMeal.price),
        prepMinutes: Number(newMeal.prepMinutes),
        servingsLeft: Number(newMeal.servings),
        description: newMeal.description,
        photos: newMealPhotos.filter(Boolean),
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      setFormError(json.error ?? "Failed to create meal");
      return;
    }
    setNewMeal({ title: "", price: "", prepMinutes: "30", servings: "5", description: "" });
    setNewMealPhotos(["", ""]);
    setShowAddMeal(false);
    refetchKitchen();
  }

  const kpis = [
    {
      label: "Rating",
      value: cook && cook.ratingCount > 0 ? roundRating(cook.ratingAvg).toFixed(1) : "New",
      Icon: Star,
    },
    { label: "Reviews", value: String(cook?.ratingCount ?? 0), Icon: MessageSquareText },
    { label: "Active listings", value: String(meals.filter((m) => m.available).length), Icon: ClipboardList },
    { label: "Open orders", value: String(queue.length), Icon: PackageCheck },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        {cook?.icon || cook?.portrait ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cook.icon || cook.portrait}
            alt={cook.icon ? `${cook.kitchenName} icon` : cook.cookName}
            className="h-16 w-16 shrink-0 rounded-md border border-zinc-100 object-cover"
          />
        ) : (
          <Avatar name={user.kitchenName ?? user.name} size="xl" tone="accent" />
        )}
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-accent-600">
            <ChefHat size={13} />
            Business account
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">
            {cook?.kitchenName ?? user.kitchenName ?? user.name}
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-zinc-500">
            {user.name}
            {cook?.location.label && (
              <>
                <span className="text-zinc-300">|</span>
                <MapPin size={13} className="text-zinc-400" />
                {cook.location.label}
              </>
            )}
          </p>
          {cook && (
            <div className="mt-1">
              <RatingStars avg={cook.ratingAvg} count={cook.ratingCount} size={13} />
            </div>
          )}
        </div>
        <Link
          href="/profile/settings"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
        >
          <Pencil size={14} />
          <span className="hidden sm:inline">Edit kitchen</span>
        </Link>
      </div>

      {/* KPIs */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {kpis.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <Icon size={16} className="text-accent-600" />
            <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-zinc-900">{value}</p>
            <p className="text-xs font-medium text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-5">
        {/* Left column: queue + listings */}
        <div className="space-y-8 lg:col-span-3">
          {/* Incoming order queue */}
          <section>
            <h2 className="mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
              <PackageCheck size={18} className="text-zinc-400" />
              Incoming orders ({queue.length})
            </h2>
            {queue.length === 0 ? (
              <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
                Queue is clear.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm">
                {queue.map((o) => (
                  <li key={o.id} className="p-3.5">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-zinc-900">
                          {o.mealTitle} <span className="font-normal text-zinc-400">x{o.qty}</span>
                        </p>
                        <p className="text-xs text-zinc-500">
                          {o.dinerName} · {o.type} · {timeLabel(o.placedAt)} ·{" "}
                          <span className="font-semibold text-zinc-700">${o.total.toFixed(2)}</span>
                        </p>
                      </div>
                      <OrderStatusBadge status={o.status} />
                    </div>
                    <div className="mt-2.5 flex gap-2">
                      {o.status === "pending" && (
                        <>
                          <button
                            disabled={busyId === o.id}
                            onClick={() => patchOrder(o.id, "accepted")}
                            className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-50"
                          >
                            <Check size={13} />
                            Accept
                          </button>
                          <button
                            disabled={busyId === o.id}
                            onClick={() => patchOrder(o.id, "cancelled")}
                            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-50"
                          >
                            <X size={13} />
                            Decline
                          </button>
                        </>
                      )}
                      {o.status === "accepted" && (
                        <button
                          disabled={busyId === o.id}
                          onClick={() => patchOrder(o.id, "ready")}
                          className="inline-flex items-center gap-1.5 rounded-md bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-50"
                        >
                          <PackageCheck size={13} />
                          Mark ready
                        </button>
                      )}
                      {o.status === "ready" && (
                        <button
                          disabled={busyId === o.id}
                          onClick={() => patchOrder(o.id, "completed")}
                          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 transition-colors hover:border-zinc-300 disabled:opacity-50"
                        >
                          <Check size={13} />
                          Complete pickup
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {history.length > 0 && (
              <details className="mt-3">
                <summary className="cursor-pointer text-sm font-medium text-zinc-500 hover:text-zinc-900">
                  Order history ({history.length})
                </summary>
                <ul className="mt-2 divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm">
                  {history.map((o) => (
                    <li key={o.id} className="flex items-center justify-between gap-3 p-3">
                      <p className="min-w-0 truncate text-sm text-zinc-700">
                        {o.mealTitle} x{o.qty}{" "}
                        <span className="text-zinc-400">
                          · {o.dinerName} · {timeLabel(o.placedAt)}
                        </span>
                      </p>
                      <span className="text-sm font-medium tabular-nums text-zinc-700">
                        ${o.total.toFixed(2)}
                      </span>
                      <OrderStatusBadge status={o.status} />
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>

          {/* Meal listings */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
                <ClipboardList size={18} className="text-zinc-400" />
                Meal listings ({meals.length})
              </h2>
              <button
                onClick={() => setShowAddMeal((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-accent-700"
              >
                <ListPlus size={14} />
                {showAddMeal ? "Close" : "New listing"}
              </button>
            </div>

            {showAddMeal && (
              <form
                onSubmit={addMeal}
                className="mb-4 space-y-3 rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
              >
                <input
                  value={newMeal.title}
                  onChange={(e) => setNewMeal({ ...newMeal, title: e.target.value })}
                  placeholder="Meal title"
                  required
                  className={inputClass}
                />
                <div className="grid grid-cols-3 gap-2">
                  <input
                    value={newMeal.price}
                    onChange={(e) => setNewMeal({ ...newMeal, price: e.target.value })}
                    placeholder="Price ($)"
                    type="number"
                    min="0"
                    step="0.5"
                    required
                    className={inputClass}
                  />
                  <input
                    value={newMeal.prepMinutes}
                    onChange={(e) => setNewMeal({ ...newMeal, prepMinutes: e.target.value })}
                    placeholder="Prep (min)"
                    type="number"
                    min="0"
                    className={inputClass}
                  />
                  <input
                    value={newMeal.servings}
                    onChange={(e) => setNewMeal({ ...newMeal, servings: e.target.value })}
                    placeholder="Servings"
                    type="number"
                    min="0"
                    className={inputClass}
                  />
                </div>
                <textarea
                  value={newMeal.description}
                  onChange={(e) => setNewMeal({ ...newMeal, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className={inputClass}
                />
                {/* Up to two dish photos; the first is the cover */}
                <div className="grid grid-cols-2 gap-3">
                  <MediaUpload
                    label="Cover photo"
                    value={newMealPhotos[0]}
                    onChange={(v) => setNewMealPhotos(([, p2]) => [v, p2])}
                    maxDim={1200}
                    aspectClass="aspect-[4/3]"
                  />
                  <MediaUpload
                    label="Second photo (optional)"
                    value={newMealPhotos[1]}
                    onChange={(v) => setNewMealPhotos(([p1]) => [p1, v])}
                    maxDim={1200}
                    aspectClass="aspect-[4/3]"
                  />
                </div>
                {formError && (
                  <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {formError}
                  </p>
                )}
                <button
                  type="submit"
                  className="w-full rounded-md bg-zinc-900 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
                >
                  Publish listing
                </button>
              </form>
            )}

            <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm">
              {meals.map((m) => (
                <li key={m.id} className="flex flex-wrap items-center gap-3 p-3.5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={m.image}
                    alt={m.title}
                    loading="lazy"
                    className="h-12 w-12 shrink-0 rounded-sm object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-900">{m.title}</p>
                    <p className="flex items-center gap-2 text-xs text-zinc-500">
                      <span className="font-semibold text-zinc-700">${m.price.toFixed(2)}</span>
                      <span className="inline-flex items-center gap-1">
                        <Clock size={11} />
                        {m.prepMinutes} min
                      </span>
                      <RatingStars avg={m.ratingAvg} count={m.ratingCount} size={10} showCount={false} />
                    </p>
                  </div>

                  {/* Servings stepper */}
                  <div className="flex items-center gap-1">
                    <button
                      disabled={busyId === m.id || m.servingsLeft <= 0}
                      onClick={() => patchMeal(m.id, { servingsLeft: m.servingsLeft - 1 })}
                      aria-label="Decrease servings"
                      className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:border-zinc-300 disabled:opacity-40"
                    >
                      <Minus size={13} />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular-nums text-zinc-900">
                      {m.servingsLeft}
                    </span>
                    <button
                      disabled={busyId === m.id}
                      onClick={() => patchMeal(m.id, { servingsLeft: m.servingsLeft + 1 })}
                      aria-label="Increase servings"
                      className="rounded-md border border-zinc-200 p-1.5 text-zinc-500 transition-colors hover:border-zinc-300 disabled:opacity-40"
                    >
                      <Plus size={13} />
                    </button>
                  </div>

                  {/* Availability toggle */}
                  <button
                    disabled={busyId === m.id}
                    onClick={() => patchMeal(m.id, { available: !m.available })}
                    className={`rounded-md border px-2.5 py-1.5 text-xs font-semibold transition-colors disabled:opacity-40 ${
                      m.available
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                        : "border-zinc-200 bg-zinc-50 text-zinc-500 hover:bg-zinc-100"
                    }`}
                  >
                    {m.available ? "Live" : "Paused"}
                  </button>

                  <button
                    disabled={busyId === m.id}
                    onClick={() => deleteMeal(m.id, m.title)}
                    aria-label={`Delete ${m.title}`}
                    className="rounded-md border border-zinc-200 p-1.5 text-zinc-400 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Right column: analytics, certs, hours */}
        <div className="space-y-8 lg:col-span-2">
          {/* Rating analytics */}
          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
              <Star size={14} />
              Rating analytics
            </h2>
            <div className="flex items-end gap-3">
              <span className="text-4xl font-extrabold tabular-nums leading-none text-zinc-900">
                {cook && cook.ratingCount > 0 ? roundRating(cook.ratingAvg).toFixed(1) : "0.0"}
              </span>
              <div>
                {cook && <RatingStars avg={cook.ratingAvg} count={cook.ratingCount} size={13} showCount={false} />}
                <p className="text-xs text-zinc-500">
                  {cook?.ratingCount ?? 0} review{(cook?.ratingCount ?? 0) === 1 ? "" : "s"} · 1.0–5.0 scale
                </p>
              </div>
            </div>
            <div className="mt-4 space-y-1.5">
              {([5, 4, 3, 2, 1] as const).map((bucket) => (
                <div key={bucket} className="flex items-center gap-2">
                  <span className="w-3 text-right text-xs font-semibold tabular-nums text-zinc-600">
                    {bucket}
                  </span>
                  <div className="h-2 flex-1 rounded-sm bg-zinc-100">
                    <div
                      className="h-2 rounded-sm bg-amber-500"
                      style={{ width: `${(dist[bucket] / maxBucket) * 100}%` }}
                    />
                  </div>
                  <span className="w-6 text-xs tabular-nums text-zinc-400">{dist[bucket]}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Operating hours */}
          <section className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
              <CalendarClock size={14} />
              Operating hours
            </h2>
            <ul className="space-y-1">
              {(cook?.operatingHours ?? []).map((h) => (
                <li key={h.day} className="flex justify-between text-sm">
                  <span className="font-medium text-zinc-600">{h.day}</span>
                  <span className={h.closed ? "text-zinc-400" : "font-medium text-zinc-900"}>
                    {h.closed ? "Closed" : `${h.open} – ${h.close}`}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </main>
  );
}
