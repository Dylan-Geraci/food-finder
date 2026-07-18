import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Shared frame for the /legal/* pages — the navy "trust register" from
 * the footer carried to full-page scale. Server-safe (no hooks). Legal
 * documents are one of the few places numbered sections genuinely carry
 * information, so LegalSection renders statutory-style numbering.
 */
export function LegalShell({
  Icon,
  eyebrow,
  title,
  intro,
  children,
}: {
  Icon: LucideIcon;
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <main className="bg-white">
      {/* Navy header band */}
      <header className="border-b-4 border-accent-600 bg-trust-900">
        <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 sm:py-16">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-trust-300">
            <Icon size={14} className="text-accent-500" aria-hidden />
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-trust-200">{intro}</p>
          <p className="mt-4 text-[11px] uppercase tracking-wider text-trust-400">
            Effective July 17, 2026 · California
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">{children}</div>
    </main>
  );
}

/** Numbered legal section — "3. Seller obligations" style. */
export function LegalSection({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-zinc-100 py-6 first:pt-0 last:border-b-0">
      <h2 className="flex items-baseline gap-3 text-lg font-bold tracking-tight text-zinc-900">
        <span className="text-sm font-extrabold tabular-nums text-trust-400">{num}.</span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 pl-7 text-sm leading-relaxed text-zinc-600">
        {children}
      </div>
    </section>
  );
}

/** Cream statutory callout — reserved for language the law requires. */
export function LegalCallout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-md border border-cream-300 bg-cream-100 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-trust-600">{label}</p>
      <div className="mt-1.5 text-sm leading-relaxed text-trust-900">{children}</div>
    </div>
  );
}
