"use client";

import Link from "next/link";
import { MapPin, Map as MapIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { MARKET_NAME } from "@/services/market";
import { UserMenu } from "./UserMenu";

/**
 * Top navigation — wordmark, delivery area, auth entry.
 * Intentionally NOT sticky: it scrolls away with the page so the category
 * filter bar can lock cleanly to the top of the viewport with no gap.
 */
export function Navbar() {
  const { status, user, openAuth } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-zinc-900">
          Home<span className="text-accent-600">Plate</span>
        </Link>

        <span className="hidden items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 sm:inline-flex">
          <MapPin size={15} className="text-accent-600" />
          {MARKET_NAME}
        </span>

        <nav className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <Link
            href="/map"
            className="hidden items-center gap-1.5 rounded-md px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 md:inline-flex"
          >
            <MapIcon size={16} />
            Map
          </Link>

          {status === "authed" && user ? (
            <UserMenu />
          ) : (
            <>
              <button
                onClick={() => openAuth("login")}
                className="rounded-md px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100"
              >
                Log in
              </button>
              <button
                onClick={() => openAuth("signup")}
                className="rounded-md bg-accent-600 px-3.5 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
              >
                Sign up
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
