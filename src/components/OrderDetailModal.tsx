"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Bike, CalendarClock, Hash, MessageSquareText, Store, X } from "lucide-react";
import { OrderStatusBadge } from "./OrderStatusBadge";

export interface OrderDetail {
  id: string;
  qty: number;
  priceEach: number;
  total: number;
  type: string;
  note: string;
  status: string;
  placedAt: string;
  mealTitle: string;
  mealImage: string;
  /** Diner perspective: link back to the kitchen. */
  cookId?: string;
  kitchenName?: string;
  /** Kitchen perspective: who ordered. */
  dinerName?: string;
}

function fullDate(iso: string): string {
  const d = new Date(iso);
  return `${d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })} · ${d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}`;
}

/**
 * Order detail modal — the expanded view behind every order row on both
 * dashboards: line items, price breakdown, fulfillment type, the diner's
 * note, and timestamps.
 */
export function OrderDetailModal({
  order,
  perspective,
  onClose,
}: {
  order: OrderDetail | null;
  perspective: "diner" | "kitchen";
  onClose: () => void;
}) {
  const open = order !== null;

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

  if (!open || !order) return null;

  const TypeIcon = order.type === "delivery" ? Bike : Store;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={`Order details — ${order.mealTitle}`}
    >
      <button aria-label="Close" className="absolute inset-0 bg-zinc-950/45" onClick={onClose} />
      <div className="menu-pop relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-lg border border-zinc-200 bg-white shadow-2xl sm:w-[440px] sm:rounded-md">
        {/* Header strip */}
        <div className="relative h-28 shrink-0 bg-zinc-100">
          {order.mealImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={order.mealImage} alt={order.mealTitle} className="h-full w-full object-cover" />
          )}
          <button
            onClick={onClose}
            aria-label="Close"
            className="absolute right-3 top-3 rounded-md border border-zinc-200 bg-white/95 p-1.5 text-zinc-600 shadow-sm transition-colors hover:text-zinc-900"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-lg font-extrabold leading-tight tracking-tight text-zinc-900">
                {order.mealTitle}
              </h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {perspective === "diner" && order.cookId ? (
                  <Link
                    href={`/cooks/${order.cookId}`}
                    onClick={onClose}
                    className="font-medium text-zinc-600 transition-colors hover:text-accent-600"
                  >
                    {order.kitchenName}
                  </Link>
                ) : (
                  <>Ordered by <span className="font-medium text-zinc-700">{order.dinerName}</span></>
                )}
              </p>
            </div>
            <OrderStatusBadge status={order.status} />
          </div>

          {/* Facts */}
          <dl className="mt-5 space-y-3 border-t border-zinc-100 pt-4">
            <div className="flex items-center gap-2.5 text-sm">
              <TypeIcon size={15} className="shrink-0 text-zinc-400" />
              <dt className="w-24 shrink-0 text-zinc-500">Fulfillment</dt>
              <dd className="font-medium capitalize text-zinc-900">{order.type}</dd>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <CalendarClock size={15} className="shrink-0 text-zinc-400" />
              <dt className="w-24 shrink-0 text-zinc-500">Placed</dt>
              <dd className="font-medium text-zinc-900">{fullDate(order.placedAt)}</dd>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <Hash size={15} className="shrink-0 text-zinc-400" />
              <dt className="w-24 shrink-0 text-zinc-500">Order ID</dt>
              <dd className="font-mono text-xs text-zinc-500">{order.id.slice(-8).toUpperCase()}</dd>
            </div>
          </dl>

          {/* Note */}
          {order.note && (
            <div className="mt-4 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="mb-1 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-zinc-400">
                <MessageSquareText size={12} />
                Note to the kitchen
              </p>
              <p className="text-sm leading-relaxed text-zinc-700">{order.note}</p>
            </div>
          )}

          {/* Price breakdown */}
          <div className="mt-5 border-t border-zinc-100 pt-4">
            <div className="flex items-center justify-between text-sm text-zinc-500">
              <span>
                {order.mealTitle} × {order.qty}
              </span>
              <span className="tabular-nums">
                {order.qty} × ${order.priceEach.toFixed(2)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between border-t border-zinc-100 pt-2">
              <span className="text-sm font-semibold text-zinc-900">Total</span>
              <span className="text-base font-extrabold tabular-nums text-zinc-900">
                ${order.total.toFixed(2)}
              </span>
            </div>
            <p className="mt-1 text-right text-[11px] text-zinc-400">Paid directly to the kitchen</p>
          </div>
        </div>
      </div>
    </div>
  );
}
