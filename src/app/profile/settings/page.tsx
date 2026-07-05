"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CalendarClock,
  CalendarPlus,
  Check,
  ChefHat,
  Lock,
  Mail,
  SlidersHorizontal,
  Store,
  Trash2,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { PASSWORD_RULES, passwordProblems } from "@/services/password-rules";
import { Avatar } from "@/components/Avatar";
import { MediaUpload } from "@/components/MediaUpload";

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none";

const PREFS_KEY = "homeplate.prefs";

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

interface KitchenIdentityData {
  cook: {
    id: string;
    kitchenName: string;
    bio: string;
    banner: string;
    icon: string;
  };
}

/**
 * Kitchen identity editor — name, bio, and the two distinct visual marks:
 * a wide banner for the kitchen page hero and a square icon used on cards
 * and menus. Photos are compressed client-side before saving.
 */
function KitchenIdentitySection({ cookId }: { cookId: string }) {
  const { refreshSession } = useAuth();
  const { data, refetch } = useFetch<KitchenIdentityData>(`/api/cooks/${cookId}`);

  const [kitchenName, setKitchenName] = useState("");
  const [bio, setBio] = useState("");
  const [banner, setBanner] = useState("");
  const [icon, setIcon] = useState("");
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.cook || loaded) return;
    setKitchenName(data.cook.kitchenName);
    setBio(data.cook.bio);
    setBanner(data.cook.banner);
    setIcon(data.cook.icon);
    setLoaded(true);
  }, [data, loaded]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/cooks/${cookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kitchenName, bio, banner, icon }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save kitchen profile");
      } else {
        await refreshSession(); // kitchen name/icon live in the session payload
        refetch();
        setSaved(true);
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
        <Store size={14} />
        Kitchen identity
      </h2>
      <p className="mb-4 text-xs text-zinc-400">
        How your kitchen appears across the marketplace — cards, quick view, and your page.
      </p>
      {!loaded ? (
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-md bg-zinc-100" />
          <div className="h-9 animate-pulse rounded-md bg-zinc-100" />
        </div>
      ) : (
        <form onSubmit={save} className="space-y-4">
          <MediaUpload
            label="Banner photo"
            hint="Wide hero shown across the top of your kitchen page — 1600px or larger looks best"
            value={banner}
            onChange={(v) => {
              setBanner(v);
              setSaved(false);
            }}
            maxDim={1600}
            aspectClass="aspect-[3/1]"
          />
          <div className="flex items-end gap-4">
            <MediaUpload
              label="Kitchen icon"
              value={icon}
              onChange={(v) => {
                setIcon(v);
                setSaved(false);
              }}
              maxDim={512}
              aspectClass="aspect-square w-28"
            />
            <p className="pb-1 text-xs leading-relaxed text-zinc-400">
              A square mark that stands in for your kitchen on cards and menus — separate
              from the banner. Without one, your kitchen shows a monogram.
            </p>
          </div>
          <div>
            <label htmlFor="kitchen-name" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Kitchen name
            </label>
            <input
              id="kitchen-name"
              value={kitchenName}
              onChange={(e) => {
                setKitchenName(e.target.value);
                setSaved(false);
              }}
              maxLength={80}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="kitchen-bio" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Bio
            </label>
            <textarea
              id="kitchen-bio"
              value={bio}
              onChange={(e) => {
                setBio(e.target.value);
                setSaved(false);
              }}
              rows={3}
              maxLength={600}
              className={inputClass}
              placeholder="What you cook, how you source it, and why neighbors should order."
            />
          </div>
          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save kitchen profile"}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check size={15} />
                Saved
              </span>
            )}
          </div>
        </form>
      )}
    </section>
  );
}

interface DayHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

interface HoursException {
  date: string;
  closed: boolean;
  open: string;
  close: string;
  note: string;
}

interface HoursData {
  cook: { operatingHours: DayHours[]; hoursExceptions: HoursException[] };
}

const timeInputClass =
  "rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-sm text-zinc-900 focus:border-accent-600 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-300";

function exceptionDateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/**
 * Hours management — the weekly "General Hours" grid plus date-specific
 * exceptions (holiday closures or custom hours) that override it.
 * Structured pickers only: native time and date inputs, no free text.
 */
function HoursSection({ cookId }: { cookId: string }) {
  const { data, refetch } = useFetch<HoursData>(`/api/cooks/${cookId}`);

  const [hours, setHours] = useState<DayHours[]>([]);
  const [exceptions, setExceptions] = useState<HoursException[]>([]);
  const [draft, setDraft] = useState({
    date: "",
    mode: "closed" as "closed" | "custom",
    open: "11:00",
    close: "19:00",
    note: "",
  });
  const [draftError, setDraftError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!data?.cook || loaded) return;
    setHours(data.cook.operatingHours);
    setExceptions(data.cook.hoursExceptions);
    setLoaded(true);
  }, [data, loaded]);

  function updateDay(i: number, patch: Partial<DayHours>) {
    setSaved(false);
    setHours((prev) =>
      prev.map((d, idx) => {
        if (idx !== i) return d;
        const next = { ...d, ...patch };
        // Opening a closed day starts from sensible defaults
        if (patch.closed === false && (!next.open || !next.close)) {
          next.open = next.open || "11:00";
          next.close = next.close || "19:00";
        }
        if (patch.closed === true) {
          next.open = "";
          next.close = "";
        }
        return next;
      })
    );
  }

  function addException() {
    setDraftError(null);
    if (!draft.date) {
      setDraftError("Pick a date first.");
      return;
    }
    if (exceptions.some((x) => x.date === draft.date)) {
      setDraftError("That date already has an exception — remove it first.");
      return;
    }
    const entry: HoursException = {
      date: draft.date,
      closed: draft.mode === "closed",
      open: draft.mode === "custom" ? draft.open : "",
      close: draft.mode === "custom" ? draft.close : "",
      note: draft.note.trim(),
    };
    setExceptions((prev) =>
      [...prev, entry].sort((a, b) => a.date.localeCompare(b.date))
    );
    setDraft({ date: "", mode: "closed", open: "11:00", close: "19:00", note: "" });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch(`/api/cooks/${cookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operatingHours: hours, hoursExceptions: exceptions }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save hours");
      } else {
        refetch();
        setSaved(true);
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
        <CalendarClock size={14} />
        Hours
      </h2>
      <p className="mb-4 text-xs text-zinc-400">
        Your standing weekly schedule, plus specific dates that override it.
      </p>

      {!loaded ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-zinc-100" />
          ))}
        </div>
      ) : (
        <>
          {/* General Hours */}
          <h3 className="mb-2 text-sm font-semibold text-zinc-900">General hours</h3>
          <ul className="divide-y divide-zinc-100 rounded-md border border-zinc-200">
            {hours.map((d, i) => (
              <li key={d.day} className="flex items-center gap-3 px-3 py-2">
                <span className="w-10 shrink-0 text-sm font-medium text-zinc-700">{d.day}</span>
                <Toggle
                  checked={!d.closed}
                  onChange={(openNow) => updateDay(i, { closed: !openNow })}
                  label={`Open on ${d.day}`}
                />
                {d.closed ? (
                  <span className="text-sm text-zinc-400">Closed</span>
                ) : (
                  <span className="flex items-center gap-2">
                    <input
                      type="time"
                      value={d.open}
                      onChange={(e) => updateDay(i, { open: e.target.value })}
                      aria-label={`${d.day} opening time`}
                      required
                      className={timeInputClass}
                    />
                    <span className="text-zinc-400">–</span>
                    <input
                      type="time"
                      value={d.close}
                      onChange={(e) => updateDay(i, { close: e.target.value })}
                      aria-label={`${d.day} closing time`}
                      required
                      className={timeInputClass}
                    />
                  </span>
                )}
              </li>
            ))}
          </ul>

          {/* Exceptions */}
          <h3 className="mb-1 mt-6 text-sm font-semibold text-zinc-900">Exceptions</h3>
          <p className="mb-3 text-xs text-zinc-400">
            Holidays, vacations, or one-off special hours — these dates bypass your general
            hours.
          </p>

          {exceptions.length > 0 && (
            <ul className="mb-3 divide-y divide-zinc-100 rounded-md border border-zinc-200">
              {exceptions.map((x) => (
                <li key={x.date} className="flex items-center gap-3 px-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-zinc-800">
                      {exceptionDateLabel(x.date)}
                      {x.note && <span className="font-normal text-zinc-400"> · {x.note}</span>}
                    </span>
                    <span
                      className={`text-xs font-semibold ${
                        x.closed ? "text-red-600" : "text-emerald-700"
                      }`}
                    >
                      {x.closed ? "Closed all day" : `Open ${x.open} – ${x.close}`}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setExceptions((prev) => prev.filter((e) => e.date !== x.date));
                      setSaved(false);
                    }}
                    aria-label={`Remove exception for ${exceptionDateLabel(x.date)}`}
                    className="rounded-md border border-zinc-200 p-1.5 text-zinc-400 transition-colors hover:border-red-300 hover:text-red-600"
                  >
                    <Trash2 size={13} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {/* Add-exception builder */}
          <div className="rounded-md border border-dashed border-zinc-300 bg-zinc-50 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="date"
                value={draft.date}
                min={today}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
                aria-label="Exception date"
                className={timeInputClass}
              />
              <div className="flex overflow-hidden rounded-md border border-zinc-200">
                {(
                  [
                    { key: "closed", label: "Closed all day" },
                    { key: "custom", label: "Custom hours" },
                  ] as const
                ).map(({ key, label }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setDraft({ ...draft, mode: key })}
                    aria-pressed={draft.mode === key}
                    className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                      draft.mode === key
                        ? "bg-zinc-900 text-white"
                        : "bg-white text-zinc-600 hover:text-zinc-900"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {draft.mode === "custom" && (
                <span className="flex items-center gap-2">
                  <input
                    type="time"
                    value={draft.open}
                    onChange={(e) => setDraft({ ...draft, open: e.target.value })}
                    aria-label="Exception opening time"
                    className={timeInputClass}
                  />
                  <span className="text-zinc-400">–</span>
                  <input
                    type="time"
                    value={draft.close}
                    onChange={(e) => setDraft({ ...draft, close: e.target.value })}
                    aria-label="Exception closing time"
                    className={timeInputClass}
                  />
                </span>
              )}
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                value={draft.note}
                onChange={(e) => setDraft({ ...draft, note: e.target.value })}
                maxLength={60}
                placeholder="Reason (optional) — e.g. Thanksgiving"
                className="flex-1 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none"
              />
              <button
                type="button"
                onClick={addException}
                className="inline-flex items-center gap-1.5 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-zinc-700"
              >
                <CalendarPlus size={13} />
                Add date
              </button>
            </div>
            {draftError && <p className="mt-2 text-xs text-red-600">{draftError}</p>}
          </div>

          {error && (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="mt-4 flex items-center gap-3">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
            >
              {saving ? "Saving..." : "Save hours"}
            </button>
            {saved && (
              <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
                <Check size={15} />
                Saved
              </span>
            )}
          </div>
        </>
      )}
    </section>
  );
}

/**
 * Password management — add one to a passwordless demo account, or rotate
 * an existing one (current password required). Shares the signup rules.
 */
function PasswordSection() {
  const { user, refreshSession } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;
  const hasPassword = user.hasPassword;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setError(null);
    setSaved(false);
    const problems = passwordProblems(next);
    if (problems.length > 0) {
      setError(`Password still needs: ${problems.join(", ").toLowerCase()}.`);
      return;
    }
    if (next !== confirm) {
      setError("New passwords don't match.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: user.key,
          currentPassword: hasPassword ? current : undefined,
          newPassword: next,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to update password");
      } else {
        await refreshSession();
        setCurrent("");
        setNext("");
        setConfirm("");
        setSaved(true);
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 rounded-md border border-zinc-200 bg-white p-5 shadow-sm">
      <h2 className="mb-1 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-zinc-400">
        <Lock size={14} />
        Password
      </h2>
      <p className="mb-4 text-xs text-zinc-400">
        {hasPassword
          ? "Your account is password-protected. Enter your current password to set a new one."
          : "This demo account has no password — anyone with the email can log in. Add one to protect it."}
      </p>
      <form onSubmit={submit} className="space-y-3.5">
        {hasPassword && (
          <div>
            <label htmlFor="pw-current" className="mb-1.5 block text-sm font-medium text-zinc-700">
              Current password
            </label>
            <input
              id="pw-current"
              type="password"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              required
              className={inputClass}
            />
          </div>
        )}
        <div>
          <label htmlFor="pw-new" className="mb-1.5 block text-sm font-medium text-zinc-700">
            New password
          </label>
          <input
            id="pw-new"
            type="password"
            value={next}
            onChange={(e) => {
              setNext(e.target.value);
              setSaved(false);
            }}
            required
            className={inputClass}
          />
          <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
            {PASSWORD_RULES.map((r) => {
              const met = r.test(next);
              return (
                <li
                  key={r.key}
                  className={`flex items-center gap-1.5 text-xs ${
                    met ? "text-emerald-700" : "text-zinc-400"
                  }`}
                >
                  <Check size={12} className={met ? "" : "opacity-40"} />
                  {r.label}
                </li>
              );
            })}
          </ul>
        </div>
        <div>
          <label htmlFor="pw-confirm" className="mb-1.5 block text-sm font-medium text-zinc-700">
            Confirm new password
          </label>
          <input
            id="pw-confirm"
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className={inputClass}
          />
          {confirm.length > 0 && confirm !== next && (
            <p className="mt-1.5 text-xs text-red-600">Passwords don&apos;t match yet.</p>
          )}
        </div>
        {error && (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-zinc-700 disabled:opacity-40"
          >
            {saving ? "Saving..." : hasPassword ? "Update password" : "Add password"}
          </button>
          {saved && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700">
              <Check size={15} />
              {hasPassword ? "Password updated" : "Password added"}
            </span>
          )}
        </div>
      </form>
    </section>
  );
}

/** Account settings — profile identity, kitchen media, per-device preferences. */
export default function SettingsPage() {
  const { status, user, refreshSession } = useAuth();
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
        await refreshSession(); // pull the updated payload into context
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

      {/* Password (all accounts) */}
      <PasswordSection />

      {/* Kitchen identity + hours (business accounts) */}
      {isCook && user.cookProfileId && <KitchenIdentitySection cookId={user.cookProfileId} />}
      {isCook && user.cookProfileId && <HoursSection cookId={user.cookProfileId} />}

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
