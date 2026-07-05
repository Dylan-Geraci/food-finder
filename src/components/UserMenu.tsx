"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Pencil,
  Settings,
  Store,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Avatar } from "./Avatar";

/**
 * Top-right account menu — avatar-triggered dropdown following the
 * marketplace conventions users already know (identity header up top,
 * dashboard-first items, settings and sign-out behind a divider).
 * Items are strictly role-scoped: diners see saved kitchens, kitchens
 * see their public page — never both.
 */
export function UserMenu() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // Navigating anywhere dismisses the menu
  useEffect(() => setOpen(false), [pathname]);

  // Outside click + Escape (Escape returns focus to the trigger)
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Focus the first item when the menu opens
  useEffect(() => {
    if (!open) return;
    const first = panelRef.current?.querySelector<HTMLElement>("[role=menuitem]");
    first?.focus();
  }, [open]);

  if (!user) return null;

  const isCook = user.role === "cook";
  const displayName = isCook ? (user.kitchenName ?? user.name) : user.name;
  const kitchenIcon = isCook ? user.kitchenIcon : null;

  function onMenuKeyDown(e: React.KeyboardEvent) {
    const nodes = panelRef.current?.querySelectorAll<HTMLElement>("[role=menuitem]");
    if (!nodes || nodes.length === 0) return;
    const items = [...nodes];
    const i = items.indexOf(document.activeElement as HTMLElement);
    if (e.key === "ArrowDown") {
      e.preventDefault();
      items[(i + 1) % items.length]!.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      items[(i - 1 + items.length) % items.length]!.focus();
    } else if (e.key === "Home") {
      e.preventDefault();
      items[0]!.focus();
    } else if (e.key === "End") {
      e.preventDefault();
      items[items.length - 1]!.focus();
    }
  }

  function signOut() {
    setOpen(false);
    logout();
    router.push("/");
  }

  const itemClass =
    "flex w-full items-center gap-2.5 px-4 py-2.5 text-sm font-medium text-zinc-600 " +
    "transition-colors hover:bg-zinc-50 hover:text-zinc-900 focus-visible:bg-zinc-50 " +
    "focus-visible:text-zinc-900 focus-visible:outline-none";
  const iconClass = "shrink-0 text-zinc-400";

  const links = [
    {
      href: isCook ? "/profile/business" : "/profile/user",
      label: isCook ? "Kitchen dashboard" : "My dashboard",
      Icon: LayoutDashboard,
    },
    { href: "/profile/settings", label: "Edit profile", Icon: Pencil },
    ...(isCook
      ? user.cookProfileId
        ? [{ href: `/cooks/${user.cookProfileId}`, label: "My kitchen page", Icon: Store }]
        : []
      : [{ href: "/profile/user", label: "Saved kitchens", Icon: Heart }]),
    { href: "/profile/settings#preferences", label: "Settings", Icon: Settings },
  ];

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        className={`flex items-center gap-2 rounded-md px-2 py-1.5 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-accent-600 ${
          open ? "bg-zinc-100" : ""
        }`}
      >
        {kitchenIcon ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={kitchenIcon}
            alt=""
            className="h-8 w-8 shrink-0 rounded-md border border-zinc-100 object-cover"
          />
        ) : (
          <Avatar name={displayName} size="sm" tone="accent" />
        )}
        <span className="hidden max-w-40 truncate text-sm font-medium text-zinc-800 lg:inline">
          {displayName}
        </span>
        <ChevronDown
          size={14}
          className={`text-zinc-400 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          ref={panelRef}
          role="menu"
          aria-label="Account"
          onKeyDown={onMenuKeyDown}
          className="menu-pop absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg"
        >
          {/* Identity header */}
          <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3.5">
            {kitchenIcon ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={kitchenIcon}
                alt=""
                className="h-10 w-10 shrink-0 rounded-md border border-zinc-100 object-cover"
              />
            ) : (
              <Avatar name={displayName} size="md" tone="accent" />
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-900">{displayName}</p>
              <p className="truncate text-xs text-zinc-400">{user.email}</p>
            </div>
            <span className="shrink-0 rounded-sm border border-zinc-200 bg-zinc-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              {isCook ? "Kitchen" : "Diner"}
            </span>
          </div>

          <div className="py-1">
            {links.map(({ href, label, Icon }) => (
              <Link key={label} href={href} role="menuitem" className={itemClass}>
                <Icon size={15} className={iconClass} />
                {label}
              </Link>
            ))}
          </div>

          <div className="border-t border-zinc-100 py-1">
            <button
              onClick={signOut}
              role="menuitem"
              className={`${itemClass} hover:bg-red-50 hover:text-red-700 focus-visible:bg-red-50 focus-visible:text-red-700`}
            >
              <LogOut size={15} className={iconClass} />
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
