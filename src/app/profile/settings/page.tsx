"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Check, ChefHat, Lock, Mail, SlidersHorizontal, UserRound, UtensilsCrossed } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "@/components/Avatar";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none";

const PREFS_KEY = "fablefare.prefs";

interface Prefs {
  orderUpdates: boolean;
  weeklyDigest: boolean;
}

function loadPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { orderUpdates: true, weeklyDigest: false, ...JSON.parse(raw) };
  } catch {
    // Fall through to defaults on malformed storage
  }
  return { orderUpdates: true, weeklyDigest: false };
}

/** Accessible switch — track fills with the accent when on. */
function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-600 ${
        checked ? "bg-accent-600" : "bg-zinc-200"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? "translate-x-4" : ""
        }`}
      />
    </button>
  );
}

/** Account settings — profile identity, and per-device preferences. */
export default function SettingsPage() {
  const { status, user, login } = useAuth();
  const router = useRouter();

  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prefs, setPrefs] = useState<Prefs>({ orderUpdates: true, weeklyDigest: false });

  useEffect(() => {
    if (status === "guest") router.replace("/profile");
  }, [status, router]);

  useEffect(() => {
    if (user) setName(user.name);
  }, [user]);

  useEffect(() => {
    setPrefs(loadPrefs());
  }, []);

  if (!user) {
    return <p className="py-24 text-center text-sm text-zinc-400">Loading settings...</p>;
  }

  const isCook = user.role === "cook";

  function updatePref(patch: Partial<Prefs>) {
    setPrefs((prev) => {
      const next = { ...prev, ...patch };
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      return next;
    });
  }

  async function saveAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: user.key, name }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save changes");
      } else {
        await login(user.email); // refresh the session payload in context
        setSaved(true);
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-4">
        <Avatar name={isCook ? (user.kitchenName ?? user.name) : user.name} size="xl" tone="accent" />
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-zinc-900">
            Account settings
          </h1>
          <p className="flex items-center gap-1.5 text-sm text-zinc-500">
            {isCook ? <ChefHat size={14} className="text-zinc-400" /> : <UtensilsCrossed size={14} className="text-zinc-400" />}
            {isCook ? "Kitchen account" : "Diner account"}
          </p>
        </div>
      </div>

      {/* Profile identity */}
      <section className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
          <UserRound size={14} />
          Profile
        </h2>
        <form onSubmit={saveAccount} className="space-y-4">
          <div>
            <label htmlFor="account-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Full name
            </label>
            <input
              id="account-name"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setSaved(false);
              }}
              maxLength={60}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-zinc-700">Email</label>
            <div className="flex items-center gap-2 rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2.5">
              <Mail size={14} className="shrink-0 text-zinc-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-zinc-500">{user.email}</span>
              <Lock size={13} className="shrink-0 text-zinc-300" />
            </div>
            <p className="mt-1.5 text-xs text-zinc-400">
              Your email identifies this demo account and can&apos;t be changed.
            </p>
          </div>
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving || name.trim() === user.name}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check size={15} />
                Saved
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Preferences */}
      <section
        id="preferences"
        className="mt-6 scroll-mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm"
      >
        <h2 className="mb-4 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
          <SlidersHorizontal size={14} />
          Preferences
        </h2>
        <ul className="divide-y divide-zinc-100">
          <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <BellRing size={16} className="shrink-0 text-zinc-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-800">Order status updates</p>
              <p className="text-xs text-zinc-400">
                {isCook
                  ? "Get notified the moment a new order lands in your queue."
                  : "Get notified when your order is accepted, ready, or completed."}
              </p>
            </div>
            <Toggle
              checked={prefs.orderUpdates}
              onChange={(v) => updatePref({ orderUpdates: v })}
              label="Order status updates"
            />
          </li>
          <li className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <Mail size={16} className="shrink-0 text-zinc-400" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-zinc-800">Weekly neighborhood digest</p>
              <p className="text-xs text-zinc-400">
                {isCook
                  ? "A weekly summary of your orders, reviews, and rating trend."
                  : "New kitchens and standout dishes near you, once a week."}
              </p>
            </div>
            <Toggle
              checked={prefs.weeklyDigest}
              onChange={(v) => updatePref({ weeklyDigest: v })}
              label="Weekly neighborhood digest"
            />
          </li>
        </ul>
        <p className="mt-4 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
          Preferences are stored on this device in the demo.
        </p>
      </section>
    </main>
  );
}
