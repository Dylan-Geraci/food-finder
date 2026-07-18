"use client";

import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CircleDashed,
  CircleDot,
  CheckCircle2,
  Clock3,
  FileText,
  Lock,
  ShieldCheck,
  TriangleAlert,
  XCircle,
} from "lucide-react";
import { MediaUpload } from "@/components/MediaUpload";
import { useFetch } from "@/hooks/useFetch";
import {
  DEFAULT_COMPLIANCE,
  PROGRAM_RULES,
  WEEKLY_CAP_OPTIONS,
  formatUsd,
  isClaimed,
  limitLevel,
  limitPct,
  tallyCompliance,
  type ComplianceProgram,
  type ComplianceSettings,
  type CountableOrder,
  type LimitLevel,
  type PermitStatus,
} from "@/services/compliance";

/**
 * Compliance ledger — the private California legal-limits panel on the
 * kitchen dashboard. Renders statute-annotated gauges for the active
 * program (MEHKO meal/revenue caps, Cottage Food revenue caps), the
 * program switcher, the kitchen's permit-on-file, and the claim/reserve
 * legend explaining how offline reservations count against the caps.
 * Only ever mounted for the authenticated cook's own kitchen.
 */

const PROGRAM_SEGMENTS: { key: ComplianceProgram; label: string; tagline: string }[] = [
  { key: "mehko", label: "MEHKO", tagline: "Hot meals" },
  { key: "cottage-a", label: "Class A", tagline: "Shelf-stable · direct" },
  { key: "cottage-b", label: "Class B", tagline: "Shelf-stable · wholesale" },
];

const FILL_BY_LEVEL: Record<LimitLevel, string> = {
  ok: "bg-sage-500",
  watch: "bg-amber-500",
  critical: "bg-accent-600",
  exceeded: "bg-red-600",
};

const PERMIT_BADGES: Record<
  PermitStatus,
  { label: string; className: string; Icon: typeof BadgeCheck }
> = {
  unverified: {
    label: "Unverified",
    className: "border-zinc-300 bg-white text-zinc-500",
    Icon: CircleDashed,
  },
  pending: {
    label: "Pending review",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    Icon: Clock3,
  },
  verified: {
    label: "Verified kitchen",
    className: "border-sage-200 bg-sage-100 text-sage-700",
    Icon: BadgeCheck,
  },
};

/** Tiered trust chip — also shown on the public kitchen page. */
export function PermitBadge({ status }: { status: PermitStatus }) {
  const s = PERMIT_BADGES[status] ?? PERMIT_BADGES.unverified;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.className}`}
    >
      <s.Icon size={12} />
      {s.label}
    </span>
  );
}

/** One statute-annotated limit gauge: usage, cap, colored fill, citation. */
function LimitGauge({
  label,
  used,
  cap,
  citation,
  format,
  window: windowLabel,
  className = "",
}: {
  label: string;
  used: number;
  cap: number;
  citation: string;
  format: (n: number) => string;
  window: string;
  className?: string;
}) {
  const level = limitLevel(used, cap);
  const pct = limitPct(used, cap);
  const remaining = Math.max(0, cap - used);

  return (
    <div className={`rounded-md border border-zinc-200 bg-white p-4 ${className}`}>
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className="mt-1.5 text-xl font-extrabold tabular-nums leading-none text-zinc-900">
        {format(used)}
        <span className="ml-1 text-sm font-semibold text-zinc-400">/ {format(cap)}</span>
      </p>
      <div
        role="meter"
        aria-label={`${label}: ${format(used)} of ${format(cap)}`}
        aria-valuemin={0}
        aria-valuemax={cap}
        aria-valuenow={Math.min(used, cap)}
        className="mt-3 h-2.5 overflow-hidden rounded-full bg-zinc-100"
      >
        <div
          className={`h-full rounded-full transition-[width] duration-500 ease-out motion-reduce:transition-none ${FILL_BY_LEVEL[level]}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 flex items-center justify-between gap-2 text-[11px] leading-tight">
        {level === "exceeded" ? (
          <span className="inline-flex items-center gap-1 font-semibold text-red-600">
            <TriangleAlert size={12} />
            Over the legal cap — pause new claims
          </span>
        ) : level === "critical" ? (
          <span className="font-semibold text-accent-700">
            {format(remaining)} left {windowLabel} — nearly at the cap
          </span>
        ) : (
          <span className="text-zinc-500">
            {format(remaining)} left {windowLabel}
          </span>
        )}
        <span className="shrink-0 font-medium text-trust-500">{citation}</span>
      </div>
    </div>
  );
}

interface PermitDocRow {
  id: string;
  image: string;
  status: "submitted" | "approved" | "rejected";
  extracted: {
    isPermitDocument: boolean;
    permitNumber: string;
    issuingAgency: string;
    holderName: string;
    expirationDate: string;
    confidence: string;
  } | null;
  reviewNote: string;
  submittedAt: string;
  decidedAt: string | null;
}

const DOC_BADGES: Record<
  PermitDocRow["status"],
  { label: string; className: string; Icon: typeof BadgeCheck }
> = {
  submitted: {
    label: "In review",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    Icon: Clock3,
  },
  approved: {
    label: "Approved",
    className: "border-sage-200 bg-sage-100 text-sage-700",
    Icon: BadgeCheck,
  },
  rejected: {
    label: "Rejected",
    className: "border-red-200 bg-red-50 text-red-600",
    Icon: XCircle,
  },
};

/**
 * Permit-document verification block: upload a photo of the county
 * permit, watch it move through review. Approval (by a reviewer, never
 * the client) is what turns the kitchen's badge "verified".
 */
function PermitDocumentsBlock({
  cookId,
  onChanged,
}: {
  cookId: string;
  onChanged: () => void;
}) {
  const { data, refetch } = useFetch<{ documents: PermitDocRow[] }>(
    `/api/cooks/${cookId}/permit-document`
  );
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latest = data?.documents?.[0] ?? null;

  async function submitDocument(image: string) {
    if (!image) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cooks/${cookId}/permit-document`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not submit the document");
      refetch();
      onChanged(); // kitchen badge moves to "pending"
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not submit the document");
    } finally {
      setUploading(false);
    }
  }

  const badge = latest ? DOC_BADGES[latest.status] : null;

  return (
    <div className="mt-4 border-t border-zinc-100 pt-4">
      <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-zinc-400">
        <FileText size={12} />
        Permit document
      </p>
      <p className="mt-1 text-xs leading-relaxed text-zinc-500">
        Upload a photo of the permit itself and a reviewer will verify it —
        approval is the only way a kitchen earns the{" "}
        <span className="font-semibold text-sage-700">Verified kitchen</span>{" "}
        badge.
      </p>

      {latest && badge && (
        <div className="mt-3 flex flex-wrap items-start gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={latest.image}
            alt="Submitted permit document"
            className="h-14 w-14 shrink-0 rounded-sm border border-zinc-200 object-cover"
          />
          <div className="min-w-0 flex-1 text-xs leading-relaxed text-zinc-600">
            <span
              className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${badge.className}`}
            >
              <badge.Icon size={12} />
              {badge.label}
            </span>
            <p className="mt-1.5">
              Submitted{" "}
              {new Date(latest.submittedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
              {latest.extracted?.permitNumber && (
                <>
                  {" "}
                  · read as{" "}
                  <span className="font-semibold text-zinc-800">
                    {latest.extracted.permitNumber}
                  </span>
                  {latest.extracted.issuingAgency && (
                    <> · {latest.extracted.issuingAgency}</>
                  )}
                  {latest.extracted.expirationDate && (
                    <> · expires {latest.extracted.expirationDate}</>
                  )}
                </>
              )}
            </p>
            {latest.status === "rejected" && latest.reviewNote && (
              <p className="mt-1 font-medium text-red-600">
                Reviewer: {latest.reviewNote}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="mt-3">
        <MediaUpload
          label={latest ? "Replace document" : "Upload document"}
          hint="A clear photo of the county EH permit — number and agency legible"
          value=""
          onChange={submitDocument}
          maxDim={1600}
          quality={0.85}
          aspectClass="aspect-[5/2]"
        />
        {uploading && (
          <p className="mt-1.5 text-xs font-medium text-zinc-500">
            Submitting for review...
          </p>
        )}
        {error && (
          <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

function TrackerSkeleton() {
  return (
    <div className="grid gap-3 p-4 sm:grid-cols-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="animate-pulse rounded-md border border-zinc-200 bg-white p-4">
          <div className="h-3 w-24 rounded bg-zinc-100" />
          <div className="mt-3 h-5 w-16 rounded bg-zinc-100" />
          <div className="mt-3 h-2.5 rounded-full bg-zinc-100" />
          <div className="mt-3 h-3 w-32 rounded bg-zinc-100" />
        </div>
      ))}
    </div>
  );
}

interface ComplianceTrackerProps {
  cookId: string;
  /** null while the kitchen payload is loading. */
  compliance: ComplianceSettings | null;
  /** null while the order history is loading. */
  orders: CountableOrder[] | null;
  /** Refetch the kitchen after settings persist. */
  onSaved: () => void;
}

export function ComplianceTracker({
  cookId,
  compliance,
  orders,
  onSaved,
}: ComplianceTrackerProps) {
  // Optimistic local copy — updated instantly on toggle, resynced from the
  // server payload after each save (or on error revert).
  const [local, setLocal] = useState<ComplianceSettings>(DEFAULT_COMPLIANCE);
  const [permitDraft, setPermitDraft] = useState({ permitNumber: "", permitAgency: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (compliance) {
      setLocal(compliance);
      setPermitDraft({
        permitNumber: compliance.permitNumber,
        permitAgency: compliance.permitAgency,
      });
    }
  }, [compliance]);

  const tally = useMemo(() => tallyCompliance(orders ?? []), [orders]);
  const claimedOrders = useMemo(
    () => (orders ?? []).filter((o) => isClaimed(o.status)).length,
    [orders]
  );

  const loading = compliance === null || orders === null;
  const rules = PROGRAM_RULES[local.program];
  const permitDirty =
    permitDraft.permitNumber !== local.permitNumber ||
    permitDraft.permitAgency !== local.permitAgency;

  async function save(partial: Partial<ComplianceSettings>) {
    const previous = local;
    setLocal({ ...local, ...partial });
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/cooks/${cookId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compliance: partial }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not save compliance settings");
      onSaved();
    } catch (e) {
      setLocal(previous); // revert the optimistic change
      setError(e instanceof Error ? e.message : "Could not save compliance settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section
      aria-label="Compliance ledger"
      className="mt-4 overflow-hidden rounded-md border border-trust-200 bg-zinc-50/60 shadow-sm"
    >
      {/* Navy trust header */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-trust-900 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white">
            <ShieldCheck size={15} className="text-sage-200" />
            Compliance ledger
          </h2>
          <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-trust-300">
            <Lock size={11} />
            California legal limits · visible only to you
          </p>
        </div>
        <PermitBadge status={local.permitStatus} />
      </div>

      {/* Program switcher + county cap */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <div
          role="group"
          aria-label="Legal program"
          className="grid grid-cols-3 gap-1 rounded-md bg-zinc-100 p-1"
        >
          {PROGRAM_SEGMENTS.map((seg) => {
            const active = local.program === seg.key;
            return (
              <button
                key={seg.key}
                type="button"
                aria-pressed={active}
                disabled={saving || loading}
                onClick={() => !active && save({ program: seg.key })}
                className={`rounded px-3 py-1.5 text-left transition-colors duration-150 disabled:opacity-60 ${
                  active
                    ? "bg-white text-trust-800 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <span className="block text-xs font-bold">{seg.label}</span>
                <span className="block text-[10px] leading-tight text-zinc-400">
                  {seg.tagline}
                </span>
              </button>
            );
          })}
        </div>

        {local.program === "mehko" && (
          <label className="flex items-center gap-2 text-xs font-medium text-zinc-500">
            County weekly cap
            <select
              value={local.weeklyMealCap}
              disabled={saving || loading}
              onChange={(e) => save({ weeklyMealCap: Number(e.target.value) })}
              className="rounded-md border border-zinc-200 bg-white px-2 py-1.5 text-xs font-semibold text-zinc-800 focus:border-trust-400 focus:outline-none disabled:opacity-60"
            >
              {WEEKLY_CAP_OPTIONS.map((cap) => (
                <option key={cap} value={cap}>
                  {cap} meals · {cap === 90 ? "state standard" : "stricter county"}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {error && (
        <p
          role="alert"
          className="mx-4 mt-3 flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700"
        >
          <TriangleAlert size={13} className="shrink-0" />
          {error}
        </p>
      )}

      {/* Gauges */}
      {loading ? (
        <TrackerSkeleton />
      ) : local.program === "mehko" ? (
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <LimitGauge
            label="Meals today"
            used={tally.mealsToday}
            cap={rules.mealsPerDay ?? 30}
            citation={rules.citation}
            format={(n) => String(n)}
            window="today"
          />
          <LimitGauge
            label="Meals this week"
            used={tally.mealsThisWeek}
            cap={local.weeklyMealCap}
            citation={rules.citation}
            format={(n) => String(n)}
            window="this week"
          />
          <LimitGauge
            label="Gross sales this year"
            used={tally.revenueThisYear}
            cap={rules.grossAnnualCap}
            citation="CPI-adjusted annually"
            format={formatUsd}
            window="this year"
          />
        </div>
      ) : (
        <div className="grid gap-3 p-4 sm:grid-cols-3">
          <LimitGauge
            className="sm:col-span-2"
            label={`Gross sales this year · ${rules.label}`}
            used={tally.revenueThisYear}
            cap={rules.grossAnnualCap}
            citation={rules.citation}
            format={formatUsd}
            window="this year"
          />
          <div className="rounded-md border border-cream-300 bg-cream-100 p-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-trust-600">
              Channel rules
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-trust-900">
              {rules.channelNote} Cottage Food has no statutory meal-count
              caps — the annual sales ceiling (base figure shown, CPI-adjusted
              by CDPH) and the approved shelf-stable food list govern instead.
            </p>
          </div>
        </div>
      )}

      {/* Permit on file */}
      <div className="border-t border-zinc-200 bg-white px-4 py-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
          Permit on file
        </p>
        <p className="mt-1 text-xs leading-relaxed text-zinc-500">
          § 114367.6 requires your permit number and issuing agency in every
          listing — they appear on your public kitchen page. New numbers enter
          review as{" "}
          <span className="font-semibold text-amber-700">pending</span> until
          verified.
        </p>
        <form
          className="mt-3 flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (permitDirty) save(permitDraft);
          }}
        >
          <input
            type="text"
            value={permitDraft.permitNumber}
            onChange={(e) =>
              setPermitDraft({ ...permitDraft, permitNumber: e.target.value })
            }
            placeholder="Permit number · e.g. PR0123456"
            aria-label="Permit number"
            maxLength={40}
            className="w-full flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-trust-400 focus:outline-none sm:w-auto"
          />
          <input
            type="text"
            value={permitDraft.permitAgency}
            onChange={(e) =>
              setPermitDraft({ ...permitDraft, permitAgency: e.target.value })
            }
            placeholder="Issuing agency · e.g. County of Los Angeles EH"
            aria-label="Issuing agency"
            maxLength={80}
            className="w-full flex-1 rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-trust-400 focus:outline-none sm:w-auto"
          />
          <button
            type="submit"
            disabled={!permitDirty || saving || loading}
            className="rounded-md bg-trust-800 px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-trust-700 disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save permit"}
          </button>
        </form>

        <PermitDocumentsBlock cookId={cookId} onChanged={onSaved} />
      </div>

      {/* Claim / reserve legend */}
      <div className="border-t border-trust-100 bg-trust-50 px-4 py-4">
        <p className="text-[11px] font-bold uppercase tracking-wider text-trust-600">
          How orders count · offline claims
        </p>
        <p className="mt-1 text-xs leading-relaxed text-trust-700">
          The moment a diner claims a meal — even paying cash at pickup — the
          reservation deducts servings and counts against every cap above.
          Nothing waits on a payment processor; only a cancellation releases
          the claim.
        </p>
        <ul className="mt-3 grid gap-2 text-xs sm:grid-cols-3">
          <li className="flex items-start gap-1.5">
            <CircleDot size={13} className="mt-0.5 shrink-0 text-amber-600" />
            <span className="text-trust-800">
              <span className="font-semibold">Claimed</span> — pending, in the
              kitchen, or ready.{" "}
              <span className="tabular-nums font-semibold">{tally.claimedMeals}</span>{" "}
              meal{tally.claimedMeals === 1 ? "" : "s"} across{" "}
              <span className="tabular-nums font-semibold">{claimedOrders}</span>{" "}
              live claim{claimedOrders === 1 ? "" : "s"} counting now.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-sage-600" />
            <span className="text-trust-800">
              <span className="font-semibold">Completed</span> — fulfilled and
              final; stays on the ledger.
            </span>
          </li>
          <li className="flex items-start gap-1.5">
            <XCircle size={13} className="mt-0.5 shrink-0 text-zinc-400" />
            <span className="text-trust-800">
              <span className="font-semibold">Cancelled</span> — claim
              released; never counted.
            </span>
          </li>
        </ul>
      </div>
    </section>
  );
}
