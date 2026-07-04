"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Map, CircleUser } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", Icon: Home },
  { href: "/map", label: "Map", Icon: Map },
  { href: "/profile", label: "Profile", Icon: CircleUser },
];

/** Mobile-only bottom tab bar — hidden at md+ where the top navbar takes over. */
export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur md:hidden">
      <div className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-accent-600" : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              <Icon size={20} strokeWidth={active ? 2.25 : 2} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
