"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Heart,
  Home,
  LogOut,
  MapPin,
  MessageSquareText,
  Receipt,
  Star,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { Avatar } from "@/components/Avatar";
import { RatingStars } from "@/components/RatingStars";
import { OrderStatusBadge } from "@/components/OrderStatusBadge";

interface OrderRow {
  id: string;
  qty: number;
  total: number;
  type: string;
  status: string;
  placedAt: string;
  mealTitle: string;
  mealImage: string;
  cookId: string;
  kitchenName: string;
}

interface ReviewRow {
  id: string;
  stars: number;
  comment: string;
  createdAt: string;
  mealTitle: string;
  kitchenName: string;
  cookId: string;
}

interface CookRow {
  id: string;
  kitchenName: string;
  portrait: string;
  cuisines: string[];
  ratingAvg: number;
  ratingCount: number;
  activeMeals: number;
  location: { label: string };
}

function shortDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Diner dashboard — orders, saved kitchens, addresses, review history. */
export default function DinerDashboardPage() {
  const { status, user, logout, toggleFavorite } = useAuth();
  const router = useRouter();

  // Guards: guests to the auth prompt, business accounts to their own portal
  useEffect(() => {
    if (status === "guest") router.replace("/profile");
    if (status === "authed" && user?.role === "cook") router.replace("/profile/business");
  }, [status, user, router]);

  const dinerKey = status === "authed" && user?.role === "diner" ? user.key : null;
  const { data: orderData } = useFetch<{ orders: OrderRow[] }>(
    dinerKey ? `/api/orders?dinerKey=${dinerKey}` : null
  );
  const { data: reviewData } = useFetch<{ reviews: ReviewRow[] }>(
    dinerKey ? `/api/reviews?dinerKey=${dinerKey}` : null
  );
  const { data: cookData } = useFetch<{ cooks: CookRow[] }>(dinerKey ? "/api/cooks" : null);

  if (!user || user.role !== "diner") {
    return <p className="py-24 text-center text-sm text-zinc-400">Loading dashboard...</p>;
  }

  const orders = orderData?.orders ?? [];
  const reviews = reviewData?.reviews ?? [];
  const savedKitchens = (cookData?.cooks ?? []).filter((c) =>
    user.favoriteCookIds.includes(c.id)
  );

  const stats = [
    { label: "Orders", value: orders.length, Icon: Receipt },
    { label: "Saved kitchens", value: user.favoriteCookIds.length, Icon: Heart },
    { label: "Reviews", value: reviews.length, Icon: Star },
  ];

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <Avatar name={user.name} size="xl" tone="accent" />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">{user.name}</h1>
          <p className="text-sm text-zinc-500">{user.email}</p>
          <p className="text-xs text-zinc-400">
            Diner account
            {user.joinedAt && ` · member since ${shortDate(user.joinedAt)}`}
          </p>
        </div>
        <button
          onClick={logout}
          className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-900"
        >
          <LogOut size={14} />
          Log out
        </button>
      </div>

      {/* Stats */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {stats.map(({ label, value, Icon }) => (
          <div key={label} className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm">
            <Icon size={16} className="text-accent-600" />
            <p className="mt-1.5 text-2xl font-extrabold tabular-nums text-zinc-900">{value}</p>
            <p className="text-xs font-medium text-zinc-500">{label}</p>
          </div>
        ))}
      </div>

      {/* Order history */}
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
        <Receipt size={18} className="text-zinc-400" />
        Order history
      </h2>
      {orders.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          No orders yet — find something on the home page.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm">
          {orders.map((o) => (
            <li key={o.id} className="flex items-center gap-3.5 p-3.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={o.mealImage}
                alt={o.mealTitle}
                loading="lazy"
                className="h-12 w-12 shrink-0 rounded-sm object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900">
                  {o.mealTitle} <span className="font-normal text-zinc-400">x{o.qty}</span>
                </p>
                <p className="truncate text-xs text-zinc-500">
                  <Link href={`/cooks/${o.cookId}`} className="hover:text-accent-600">
                    {o.kitchenName}
                  </Link>{" "}
                  · {o.type} · {shortDate(o.placedAt)}
                </p>
              </div>
              <span className="text-sm font-semibold tabular-nums text-zinc-900">
                ${o.total.toFixed(2)}
              </span>
              <OrderStatusBadge status={o.status} />
            </li>
          ))}
        </ul>
      )}

      {/* Saved kitchens */}
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
        <Heart size={18} className="text-zinc-400" />
        Saved kitchens
      </h2>
      {savedKitchens.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          Nothing saved yet — use the heart on any kitchen&apos;s quick view.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {savedKitchens.map((c) => (
            <div
              key={c.id}
              className="flex items-center gap-3 rounded-md border border-zinc-200 bg-white p-3.5 shadow-sm"
            >
              {c.portrait ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.portrait}
                  alt={c.kitchenName}
                  loading="lazy"
                  className="h-12 w-12 shrink-0 rounded-md object-cover"
                />
              ) : (
                <Avatar name={c.kitchenName} size="md" />
              )}
              <Link href={`/cooks/${c.id}`} className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-zinc-900 hover:text-accent-600">
                  {c.kitchenName}
                </p>
                <RatingStars avg={c.ratingAvg} count={c.ratingCount} size={11} />
                <p className="truncate text-xs text-zinc-400">
                  {c.cuisines.join(" · ")} · {c.location.label}
                </p>
              </Link>
              <button
                onClick={() => toggleFavorite(c.id)}
                aria-label="Remove from saved kitchens"
                title="Remove from saved kitchens"
                className="rounded-md border border-accent-600 bg-accent-50 p-2 text-accent-600 transition-colors hover:bg-accent-100"
              >
                <Heart size={14} className="fill-accent-600" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Addresses */}
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
        <MapPin size={18} className="text-zinc-400" />
        Delivery &amp; pickup addresses
      </h2>
      {user.addresses.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          No saved addresses.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm">
          {user.addresses.map((a) => (
            <li key={`${a.label}-${a.line1}`} className="flex items-center gap-3 p-3.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-md bg-zinc-100 text-zinc-500">
                <Home size={15} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-zinc-900">{a.label}</p>
                <p className="truncate text-xs text-zinc-500">
                  {a.line1}, {a.city}
                </p>
              </div>
              {a.isDefault && (
                <span className="rounded-sm border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                  Default
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* Review history */}
      <h2 className="mt-8 mb-3 flex items-center gap-2 text-lg font-bold tracking-tight text-zinc-900">
        <MessageSquareText size={18} className="text-zinc-400" />
        Your reviews
      </h2>
      {reviews.length === 0 ? (
        <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-500">
          You haven&apos;t reviewed anything yet.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm">
          {reviews.map((r) => (
            <li key={r.id} className="p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold text-zinc-900">
                  {r.mealTitle}
                  <Link
                    href={`/cooks/${r.cookId}`}
                    className="ml-2 font-normal text-zinc-400 hover:text-accent-600"
                  >
                    {r.kitchenName}
                  </Link>
                </p>
                <span className="shrink-0 text-xs text-zinc-400">{shortDate(r.createdAt)}</span>
              </div>
              <div className="mt-1">
                <RatingStars avg={r.stars} count={1} showCount={false} size={12} />
              </div>
              {r.comment && <p className="mt-1.5 text-sm text-zinc-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
