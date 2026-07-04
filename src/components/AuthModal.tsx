"use client";

import { useEffect, useState } from "react";
import { signIn as oauthSignIn } from "next-auth/react";
import { Apple, ChefHat, Globe, UtensilsCrossed, X, LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { Avatar } from "./Avatar";

interface DirectoryUser {
  key: string;
  name: string;
  email: string;
  role: "diner" | "cook";
}

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none";

/**
 * Auth entry modal — Log In (email lookup with demo quick-select) and
 * Sign Up (choose Diner or Kitchen account type). Session state switches
 * immediately on success; no page refresh needed.
 */
export function AuthModal() {
  const { authModal, closeAuth, login, signup } = useAuth();
  const open = authModal !== null;

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [accountType, setAccountType] = useState<"diner" | "cook">("diner");
  const [kitchenName, setKitchenName] = useState("");
  const [locationLabel, setLocationLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Demo directory for the mock login quick-select
  const { data: directory } = useFetch<{ users: DirectoryUser[] }>(
    open && mode === "login" ? "/api/users" : null
  );
  // Which OAuth providers have credentials (scaffolding stays disabled without them)
  const { data: oauthStatus } = useFetch<{ google: boolean; apple: boolean }>(
    open ? "/api/auth/oauth-status" : null
  );

  useEffect(() => {
    if (authModal) {
      setMode(authModal);
      setError(null);
    }
  }, [authModal]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, closeAuth]);

  if (!open) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const err =
      mode === "login"
        ? await login(email)
        : await signup({
            name,
            email,
            role: accountType,
            kitchenName: accountType === "cook" ? kitchenName : undefined,
            locationLabel: accountType === "cook" ? locationLabel : undefined,
          });
    setBusy(false);
    if (err) {
      setError(err);
    } else {
      setEmail("");
      setName("");
      setKitchenName("");
      setLocationLabel("");
      closeAuth();
    }
  }

  async function quickLogin(demoEmail: string) {
    setBusy(true);
    setError(null);
    const err = await login(demoEmail);
    setBusy(false);
    if (err) setError(err);
    else closeAuth();
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center sm:items-center" role="dialog" aria-modal="true">
      <button
        aria-label="Close"
        className="absolute inset-0 bg-zinc-950/45"
        onClick={closeAuth}
      />
      <div className="relative flex max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-lg border border-zinc-200 bg-white shadow-2xl sm:w-[420px] sm:rounded-md">
        {/* Header + tabs */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <span className="text-lg font-extrabold tracking-tight text-zinc-900">
            Fable<span className="text-accent-600">Fare</span>
          </span>
          <button
            onClick={closeAuth}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X size={18} />
          </button>
        </div>
        <div className="grid grid-cols-2 border-b border-zinc-200">
          {(
            [
              { key: "login", label: "Log in", Icon: LogIn },
              { key: "signup", label: "Sign up", Icon: UserPlus },
            ] as const
          ).map(({ key, label, Icon }) => (
            <button
              key={key}
              onClick={() => {
                setMode(key);
                setError(null);
              }}
              className={`flex items-center justify-center gap-2 py-3 text-sm font-semibold transition-colors ${
                mode === key
                  ? "border-b-2 border-accent-600 text-zinc-900"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <form onSubmit={submit} className="space-y-3.5">
            {mode === "signup" && (
              <>
                {/* Account type selector */}
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      { key: "diner", label: "Diner", sub: "Order home-cooked meals", Icon: UtensilsCrossed },
                      { key: "cook", label: "Kitchen", sub: "Sell what you cook", Icon: ChefHat },
                    ] as const
                  ).map(({ key, label, sub, Icon }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setAccountType(key)}
                      className={`rounded-md border p-3 text-left transition-colors ${
                        accountType === key
                          ? "border-accent-600 bg-accent-50"
                          : "border-zinc-200 hover:border-zinc-300"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={accountType === key ? "text-accent-600" : "text-zinc-400"}
                      />
                      <span className="mt-1.5 block text-sm font-semibold text-zinc-900">
                        {label}
                      </span>
                      <span className="block text-xs text-zinc-500">{sub}</span>
                    </button>
                  ))}
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Full name"
                  required
                  className={inputClass}
                />
              </>
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className={inputClass}
            />

            {mode === "signup" && accountType === "cook" && (
              <>
                <input
                  value={kitchenName}
                  onChange={(e) => setKitchenName(e.target.value)}
                  placeholder="Kitchen name (e.g. Rosa's Corner Kitchen)"
                  required
                  className={inputClass}
                />
                <input
                  value={locationLabel}
                  onChange={(e) => setLocationLabel(e.target.value)}
                  placeholder="Neighborhood (e.g. Little Arabia, Anaheim)"
                  className={inputClass}
                />
              </>
            )}

            {error && (
              <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-md bg-accent-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
            >
              {busy
                ? "Working..."
                : mode === "login"
                  ? "Log in"
                  : accountType === "cook"
                    ? "Create kitchen account"
                    : "Create account"}
            </button>
            {mode === "login" && (
              <p className="text-center text-xs text-zinc-400">
                Mock auth: any seeded or signed-up email works — no password.
              </p>
            )}
          </form>

          {/* OAuth entry points — scaffolded; buttons activate once provider
              credentials exist in .env.local (see .env.example) */}
          <div className="my-4 flex items-center gap-3">
            <span className="h-px flex-1 bg-zinc-200" />
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              or continue with
            </span>
            <span className="h-px flex-1 bg-zinc-200" />
          </div>
          <div className="grid grid-cols-2 gap-2">
            {(
              [
                { key: "google" as const, label: "Google", Icon: Globe },
                { key: "apple" as const, label: "Apple", Icon: Apple },
              ]
            ).map(({ key, label, Icon }) => {
              const enabled = oauthStatus?.[key] === true;
              return (
                <button
                  key={key}
                  type="button"
                  disabled={!enabled || busy}
                  onClick={() => oauthSignIn(key)}
                  title={
                    enabled
                      ? `Continue with ${label}`
                      : `Add AUTH_${key.toUpperCase()}_ID and AUTH_${key.toUpperCase()}_SECRET to .env.local to enable`
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-md border border-zinc-200 bg-white py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Icon size={15} />
                  {label}
                </button>
              );
            })}
          </div>
          {oauthStatus && !oauthStatus.google && !oauthStatus.apple && (
            <p className="mt-2 text-center text-[11px] text-zinc-400">
              OAuth is scaffolded — add provider credentials in .env.local to activate.
            </p>
          )}

          {mode === "login" && directory?.users && (
            <div className="mt-5">
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
                Demo accounts
              </p>
              <div className="max-h-48 divide-y divide-zinc-100 overflow-y-auto rounded-md border border-zinc-200">
                {directory.users.map((u) => (
                  <button
                    key={u.key}
                    onClick={() => quickLogin(u.email)}
                    disabled={busy}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-zinc-50 disabled:opacity-50"
                  >
                    <Avatar name={u.name} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-zinc-800">
                        {u.name}
                      </span>
                      <span className="block truncate text-xs text-zinc-400">{u.email}</span>
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">
                      {u.role === "cook" ? <ChefHat size={12} /> : <UtensilsCrossed size={12} />}
                      {u.role === "cook" ? "Kitchen" : "Diner"}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
