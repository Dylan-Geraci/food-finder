"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { LogIn, UserPlus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * Profile router — sends each session to its own dashboard:
 *   diner -> /profile/user     cook -> /profile/business
 * Guests get an auth prompt instead of a dashboard.
 */
export default function ProfileRouterPage() {
  const { status, user, openAuth } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status !== "authed" || !user) return;
    router.replace(user.role === "cook" ? "/profile/business" : "/profile/user");
  }, [status, user, router]);

  if (status === "loading" || status === "authed") {
    return <p className="py-24 text-center text-sm text-zinc-400">Loading profile...</p>;
  }

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">
        You&apos;re browsing as a guest
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-500">
        Log in to see your orders, saved kitchens and reviews — or create a
        diner or kitchen account in seconds.
      </p>
      <div className="mt-6 flex justify-center gap-2">
        <button
          onClick={() => openAuth("login")}
          className="inline-flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
        >
          <LogIn size={15} />
          Log in
        </button>
        <button
          onClick={() => openAuth("signup")}
          className="inline-flex items-center gap-2 rounded-md bg-accent-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
        >
          <UserPlus size={15} />
          Sign up
        </button>
      </div>
    </main>
  );
}
