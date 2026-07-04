"use client";

import Link from "next/link";
import { MapPin, Map as MapIcon, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";

/**
 * Top navigation — wordmark, delivery area, auth entry.
 * Intentionally NOT sticky: it scrolls away with the page so the category
 * filter bar can lock cleanly to the top of the viewport with no gap.
 */
export function Navbar() {
  const { status, user, openAuth, logout } = useAuth();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="text-lg font-extrabold tracking-tight text-zinc-900">
          Fable<span className="text-accent-600">Fare</span>
        </Link>

        <span className="hidden items-center gap-1.5 rounded-md border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 sm:inline-flex">
          <MapPin size={15} className="text-accent-600" />
          Austin, TX
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
            <>
              <Link
                href="/profile"
                className="flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-100"
              >
                <Avatar name={user.name} size="sm" tone="accent" />
                <span className="hidden text-sm font-medium text-zinc-800 lg:inline">
                  {user.role === "cook" ? user.kitchenName ?? user.name : user.name}
                </span>
              </Link>
              <button
                onClick={logout}
                aria-label="Log out"
                title="Log out"
                className="rounded-md p-2 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
              >
                <LogOut size={16} />
              </button>
            </>
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
