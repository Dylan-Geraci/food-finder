"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bike, Check, Clock, Minus, Plus, Store, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useOrder } from "@/context/OrderContext";

/**
 * Order configuration modal — quantity, pickup/delivery, and an optional
 * note to the kitchen, ending in a local "Order placed" success state.
 * Deliberately no payment step: the MVP simulates checkout.
 */
export function OrderModal() {
  const { target, closeOrder } = useOrder();
  const { user } = useAuth();
  const open = target !== null;

  const [qty, setQty] = useState(1);
  const [type, setType] = useState<"pickup" | "delivery">("pickup");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<{ total: number } | null>(null);

  // Fresh form each time a meal is chosen
  useEffect(() => {
    if (target) {
      setQty(1);
      setType("pickup");
      setNote("");
      setError(null);
      setPlaced(null);
    }
  }, [target]);

  // Lock body scroll while open; close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeOrder();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeOrder]);

  if (!open || !target) return null;

  const maxQty = Math.min(20, Math.max(1, target.servingsLeft));
  const total = Math.round(target.price * qty * 100) / 100;

  async function placeOrder(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !target) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mealId: target.mealId,
          dinerKey: user.key,
          qty,
          type,
          note,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to place order");
      } else {
        setPlaced({ total: json.order.total });
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={placed ? "Order placed" : `Order ${target.title}`}
    >
      <button
        aria-label="Close"
        className="absolute inset-0 bg-zinc-950/45"
        onClick={closeOrder}
      />
      <div className="menu-pop relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-lg border border-zinc-200 bg-white shadow-2xl sm:w-[440px] sm:rounded-md">
        {placed ? (
          /* ---------- Success state ---------- */
          <div className="px-6 py-10 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-md bg-emerald-600 text-white">
              <Check size={24} strokeWidth={2.5} />
            </span>
            <h2 className="mt-4 text-xl font-extrabold tracking-tight text-zinc-900">
              Order placed
            </h2>
            <p className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-zinc-500">
              {target.kitchenName} has your order for{" "}
              <span className="font-semibold text-zinc-900">
                {qty} × {target.title}
              </span>{" "}
              (${placed.total.toFixed(2)}) and will confirm it shortly.
            </p>
            <div className="mt-6 flex justify-center gap-2">
              <Link
                href="/profile/user"
                onClick={closeOrder}
                className="rounded-md bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                View my orders
              </Link>
              <button
                onClick={closeOrder}
                className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
              >
                Keep browsing
              </button>
            </div>
          </div>
        ) : (
          /* ---------- Configuration state ---------- */
          <>
            <div className="relative h-36 shrink-0 bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={target.image}
                alt={target.title}
                className="h-full w-full object-cover"
              />
              <button
                onClick={closeOrder}
                aria-label="Close"
                className="absolute right-3 top-3 rounded-md border border-zinc-200 bg-white/95 p-1.5 text-zinc-600 shadow-sm transition-colors hover:text-zinc-900"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={placeOrder} className="flex-1 space-y-5 overflow-y-auto p-5">
              <div>
                <h2 className="text-lg font-extrabold leading-tight tracking-tight text-zinc-900">
                  {target.title}
                </h2>
                <p className="mt-0.5 flex items-center gap-2 text-sm text-zinc-500">
                  {target.kitchenName}
                  <span className="text-zinc-300">|</span>
                  <span className="inline-flex items-center gap-1">
                    <Clock size={12} />
                    ready in ~{target.prepMinutes} min
                  </span>
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-zinc-700">Quantity</p>
                  <p className="text-xs text-zinc-400">
                    {target.servingsLeft} serving{target.servingsLeft === 1 ? "" : "s"} left today
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    disabled={qty <= 1}
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="Decrease quantity"
                    className="rounded-md border border-zinc-200 p-2 text-zinc-600 transition-colors hover:border-zinc-300 disabled:opacity-40"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-10 text-center text-base font-bold tabular-nums text-zinc-900">
                    {qty}
                  </span>
                  <button
                    type="button"
                    disabled={qty >= maxQty}
                    onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                    aria-label="Increase quantity"
                    className="rounded-md border border-zinc-200 p-2 text-zinc-600 transition-colors hover:border-zinc-300 disabled:opacity-40"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              {/* Pickup / delivery */}
              <div>
                <p className="mb-1.5 text-sm font-medium text-zinc-700">How do you want it?</p>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "pickup", label: "Pickup", sub: "At the kitchen", Icon: Store },
                      { key: "delivery", label: "Delivery", sub: "To your address", Icon: Bike },
                    ] as const
                  ).map(({ key, label, sub, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setType(key)}
                      aria-pressed={type === key}
                      className={`rounded-md border p-3 text-left transition-colors ${
                        type === key
                          ? "border-accent-600 bg-accent-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <Icon
                        size={17}
                        className={type === key ? "text-accent-600" : "text-zinc-400"}
                      />
                      <span className="mt-1 block text-sm font-semibold text-zinc-900">
                        {label}
                      </span>
                      <span className="block text-xs text-zinc-500">{sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Note to kitchen */}
              <div>
                <label
                  htmlFor="order-note"
                  className="mb-1.5 block text-sm font-medium text-zinc-700"
                >
                  Note to the kitchen <span className="font-normal text-zinc-400">(optional)</span>
                </label>
                <textarea
                  id="order-note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  maxLength={300}
                  placeholder="Allergies, spice level, pickup time..."
                  className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none"
                />
              </div>

              {error && (
                <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </p>
              )}

              {/* Total + submit */}
              <div className="border-t border-zinc-100 pt-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-zinc-500">
                    {qty} × ${target.price.toFixed(2)}
                  </span>
                  <span className="text-base font-extrabold tabular-nums text-zinc-900">
                    ${total.toFixed(2)}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-md bg-accent-600 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
                >
                  {busy ? "Placing order..." : `Place ${type} order · $${total.toFixed(2)}`}
                </button>
                <p className="mt-2 text-center text-[11px] text-zinc-400">
                  No payment in the demo — you pay the kitchen directly.
                </p>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
