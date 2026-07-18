"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShieldAlert, UtensilsCrossed } from "lucide-react";

const MARKETPLACE_LINKS = [
  { href: "/", label: "Browse meals" },
  { href: "/map", label: "Kitchen map" },
  { href: "/profile", label: "Your profile" },
];

const LEGAL_LINKS = [
  { href: "/legal/terms", label: "Terms of Service" },
  { href: "/legal/privacy", label: "Privacy Policy" },
  { href: "/legal/health-disclosure", label: "CA Health Disclosure" },
];

/**
 * Global legal footer — the platform's "trust register": deep navy, set
 * apart from the terracotta marketplace above it. Carries the postings
 * Cal. HSC § 114367.6 requires an Internet Food Service Intermediary to
 * make clearly and conspicuously: the home-kitchen consumer disclosure
 * (the cream panel, deliberately the loudest element here), platform
 * fees, and liability-insurance status.
 */
export function SiteFooter() {
  const pathname = usePathname();
  // The map route is a full-viewport surface; a footer below it would
  // push the map out of its exact-height calc.
  if (pathname === "/map") return null;

  return (
    <footer className="mt-16 border-t-4 border-accent-600 bg-trust-900 text-trust-200">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        {/* Mandatory California home-kitchen disclosure */}
        <div className="flex gap-3.5 rounded-md border border-cream-300 bg-cream-100 p-4 sm:p-5">
          <ShieldAlert size={20} className="mt-0.5 shrink-0 text-trust-700" aria-hidden />
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-trust-600">
              California home kitchen disclosure
            </p>
            <p className="mt-1 text-sm leading-relaxed text-trust-900">
              Food sold through HomePlate is prepared in{" "}
              <strong>private home kitchens</strong> operating as permitted
              microenterprise home kitchen operations (MEHKOs) or registered
              cottage food operations — not in commercial facilities — and may
              not be subject to routine government inspection. Cal. Health &amp;
              Saf. Code § 114367.6.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <p className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white">
              <UtensilsCrossed size={18} className="text-accent-500" aria-hidden />
              HomePlate
            </p>
            <p className="mt-2 text-sm leading-relaxed text-trust-300">
              A neighborhood marketplace for home-cooked food. Serving Orange
              County &amp; Los Angeles, California.
            </p>
          </div>

          {/* Marketplace */}
          <nav aria-label="Marketplace">
            <p className="text-[11px] font-bold uppercase tracking-wider text-trust-400">
              Marketplace
            </p>
            <ul className="mt-3 space-y-2">
              {MARKETPLACE_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-trust-200 transition-colors hover:text-white"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Legal */}
          <nav aria-label="Legal">
            <p className="text-[11px] font-bold uppercase tracking-wider text-trust-400">
              Legal
            </p>
            <ul className="mt-3 space-y-2">
              {LEGAL_LINKS.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-trust-200 underline decoration-trust-600 underline-offset-4 transition-colors hover:text-white hover:decoration-accent-500"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* IFSI conspicuous postings (§ 114367.6) */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-trust-400">
              Platform disclosures
            </p>
            <p className="mt-3 text-xs leading-relaxed text-trust-300">
              HomePlate operates as an{" "}
              <span className="font-semibold text-trust-100">
                Internet Food Service Intermediary
              </span>{" "}
              under Cal. Health &amp; Saf. Code § 114367.6. Transactions are
              made directly between you and the cook.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-trust-300">
              <span className="font-semibold text-trust-100">Fees:</span>{" "}
              HomePlate charges no platform, listing, or transaction fees
              during the pilot.
            </p>
            <p className="mt-2 text-xs leading-relaxed text-trust-300">
              <span className="font-semibold text-trust-100">Insurance:</span>{" "}
              HomePlate does not carry liability insurance covering incidents
              arising from the sale or consumption of food listed on this
              platform.
            </p>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-trust-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-4 text-[11px] leading-relaxed text-trust-400 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p>© 2026 HomePlate. Made for California neighborhoods.</p>
          <p>
            Sellers must hold a valid permit or registration from their county
            Environmental Health department.
          </p>
        </div>
      </div>
    </footer>
  );
}
