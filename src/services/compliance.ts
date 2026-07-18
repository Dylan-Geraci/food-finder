/**
 * California home-food compliance engine — statutory constants + pure
 * tally math for the private kitchen compliance ledger.
 *
 * Two legal programs cover home food sales in CA:
 *
 *  - MEHKO (Microenterprise Home Kitchen Operation) — hot, ready-to-eat
 *    meals. Cal. Health & Saf. Code ch. 11.6 (§ 114367 et seq.), caps as
 *    amended by AB 1325 (2023, effective 2024): ≤30 individual meals/day,
 *    ≤90 individual meals/week, ≤$100,000 verifiable gross annual sales
 *    (CPI-adjusted). Counties opt in and may hold stricter local caps.
 *
 *  - Cottage Food Operation (CFO) — shelf-stable foods from an approved
 *    list. Cal. Health & Saf. Code § 113758: Class A sells direct to
 *    consumers only ($75,000 base annual cap); Class B adds indirect/
 *    wholesale sales under annual county inspection ($150,000 base cap).
 *    Both caps are CPI-adjusted annually; no statutory meal-count caps.
 *
 * Everything here is pure and framework-agnostic (like rating.ts) so the
 * same rules can back API validation, the dashboard, or a native client.
 */

export type ComplianceProgram = "mehko" | "cottage-a" | "cottage-b";
export type PermitStatus = "unverified" | "pending" | "verified";

export interface ComplianceSettings {
  program: ComplianceProgram;
  /** Weekly meal cap actually enforced locally: 90 statewide standard,
   *  60 where a county retained the pre-AB 1325 cap. MEHKO only. */
  weeklyMealCap: number;
  permitNumber: string;
  /** Issuing enforcement agency, e.g. "County of Los Angeles EH". */
  permitAgency: string;
  permitStatus: PermitStatus;
}

export const COMPLIANCE_PROGRAMS: ComplianceProgram[] = [
  "mehko",
  "cottage-a",
  "cottage-b",
];
export const PERMIT_STATUSES: PermitStatus[] = ["unverified", "pending", "verified"];
export const WEEKLY_CAP_OPTIONS = [90, 60] as const;

export const DEFAULT_COMPLIANCE: ComplianceSettings = {
  program: "mehko",
  weeklyMealCap: 90,
  permitNumber: "",
  permitAgency: "",
  permitStatus: "unverified",
};

/** Statutory caps + citations, keyed by program. Dollar caps are the
 *  statutory base figures; CDPH adjusts them upward each year by CPI. */
export const PROGRAM_RULES: Record<
  ComplianceProgram,
  {
    label: string;
    tagline: string;
    citation: string;
    mealsPerDay: number | null;
    mealsPerWeek: number | null; // MEHKO: superseded by settings.weeklyMealCap
    grossAnnualCap: number;
    channelNote: string;
  }
> = {
  mehko: {
    label: "MEHKO",
    tagline: "Hot meals",
    citation: "HSC § 114367.5 · AB 1325",
    mealsPerDay: 30,
    mealsPerWeek: 90,
    grossAnnualCap: 100_000,
    channelNote: "Direct sales only — same-day prepared meals, no wholesale.",
  },
  "cottage-a": {
    label: "Cottage Food · Class A",
    tagline: "Shelf-stable, direct",
    citation: "HSC § 113758(a)(1)",
    mealsPerDay: null,
    mealsPerWeek: null,
    grossAnnualCap: 75_000,
    channelNote: "Direct-to-consumer sales only from the approved food list.",
  },
  "cottage-b": {
    label: "Cottage Food · Class B",
    tagline: "Shelf-stable, wholesale",
    citation: "HSC § 113758(a)(2)",
    mealsPerDay: null,
    mealsPerWeek: null,
    grossAnnualCap: 150_000,
    channelNote: "Direct + indirect (retail/restaurant) sales; annual county inspection.",
  },
};

/** Minimal order shape the tally functions need — matches the rows the
 *  orders API already returns, so callers pass them straight through. */
export interface CountableOrder {
  qty: number;
  total: number;
  status: string;
  placedAt: string | Date;
}

/**
 * An order counts against the legal caps from the moment servings are
 * claimed — pending/accepted/ready ("claimed") and completed all count;
 * only a cancellation releases the claim. Counting conservatively at
 * claim time means a kitchen can never discover it crossed a statutory
 * cap after the food is already promised.
 */
export function countsTowardCaps(status: string): boolean {
  return status !== "cancelled";
}

/** Claimed = reserved but not yet fulfilled (offline/no-payment flow). */
export function isClaimed(status: string): boolean {
  return status === "pending" || status === "accepted" || status === "ready";
}

/** Local-midnight start of the calendar day containing `d`. */
export function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Monday-anchored start of the calendar week containing `d`. */
export function startOfWeek(d: Date): Date {
  const day = startOfDay(d);
  const offset = (day.getDay() + 6) % 7; // Sun=0 → 6, Mon=1 → 0
  day.setDate(day.getDate() - offset);
  return day;
}

/** Jan 1 of the calendar year containing `d` (annual gross sales window). */
export function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}

export interface ComplianceTally {
  mealsToday: number;
  mealsThisWeek: number;
  revenueThisYear: number;
  /** Meals currently claimed but unfulfilled — the live offline-reserve count. */
  claimedMeals: number;
}

/** Windowed totals for the gauges. `now` is injectable for tests. */
export function tallyCompliance(
  orders: CountableOrder[],
  now: Date = new Date()
): ComplianceTally {
  const dayStart = startOfDay(now).getTime();
  const weekStart = startOfWeek(now).getTime();
  const yearStart = startOfYear(now).getTime();

  const tally: ComplianceTally = {
    mealsToday: 0,
    mealsThisWeek: 0,
    revenueThisYear: 0,
    claimedMeals: 0,
  };

  for (const o of orders) {
    if (!countsTowardCaps(o.status)) continue;
    const t = new Date(o.placedAt).getTime();
    if (Number.isNaN(t) || t > now.getTime()) continue;
    const qty = Math.max(0, o.qty || 0);
    if (isClaimed(o.status)) tally.claimedMeals += qty;
    if (t >= dayStart) tally.mealsToday += qty;
    if (t >= weekStart) tally.mealsThisWeek += qty;
    if (t >= yearStart) tally.revenueThisYear += Math.max(0, o.total || 0);
  }
  tally.revenueThisYear = Math.round(tally.revenueThisYear * 100) / 100;
  return tally;
}

export type LimitLevel = "ok" | "watch" | "critical" | "exceeded";

/** Gauge severity: sage → amber → terracotta → red as usage approaches
 *  the cap. Guarded like the rating engine — a zero cap never divides. */
export function limitLevel(used: number, cap: number): LimitLevel {
  if (cap <= 0) return "ok";
  if (used >= cap) return "exceeded";
  const pct = used / cap;
  if (pct >= 0.9) return "critical";
  if (pct >= 0.7) return "watch";
  return "ok";
}

/** Fill percentage for a gauge bar, clamped to [0, 100]. */
export function limitPct(used: number, cap: number): number {
  if (cap <= 0) return 0;
  return Math.min(100, Math.max(0, (used / cap) * 100));
}

/** "$86,400" — whole-dollar display for revenue meters. */
export function formatUsd(n: number): string {
  return `$${Math.round(n).toLocaleString("en-US")}`;
}
