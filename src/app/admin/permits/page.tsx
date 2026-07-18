"use client";

import { useState } from "react";
import {
  BadgeCheck,
  CheckCircle2,
  Inbox,
  ScanSearch,
  ShieldCheck,
  TriangleAlert,
  X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useFetch } from "@/hooks/useFetch";
import { PROGRAM_RULES, type ComplianceSettings } from "@/services/compliance";

interface QueueRow {
  id: string;
  image: string;
  extracted: {
    isPermitDocument: boolean;
    permitNumber: string;
    issuingAgency: string;
    holderName: string;
    expirationDate: string;
    confidence: string;
  } | null;
  submittedAt: string;
  cookId: string;
  kitchenName: string;
  cookName: string;
  locationLabel: string;
  compliance: ComplianceSettings;
}

/** Loose match for permit numbers: case/punctuation-insensitive. */
function normalize(s: string): string {
  return s.replace(/[^a-z0-9]/gi, "").toLowerCase();
}

/**
 * Operator permit review queue — the human end of the Option A pipeline.
 * Compares what the cook typed against what was read off the document;
 * approve is the only path to the "Verified kitchen" tier. Gate access
 * by setting HOMEPLATE_ADMIN_EMAILS (open in local dev when unset).
 */
export default function PermitReviewPage() {
  const { status, user } = useAuth();
  const actor = encodeURIComponent(user?.email ?? "");
  const { data, error, refetch } = useFetch<{ queue: QueueRow[] }>(
    status === "loading" ? null : `/api/admin/permits?actorEmail=${actor}`
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  async function decide(id: string, action: "approve" | "reject") {
    setBusyId(id);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/permits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          note: notes[id] ?? "",
          actorEmail: user?.email ?? "",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Decision failed");
      refetch();
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Decision failed");
    } finally {
      setBusyId(null);
    }
  }

  const queue = data?.queue ?? [];

  return (
    <main className="bg-zinc-50/60 pb-16">
      {/* Trust header band */}
      <header className="border-b-4 border-accent-600 bg-trust-900">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-trust-300">
            <ShieldCheck size={14} className="text-sage-200" />
            Operator tooling
          </p>
          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-white">
            Permit review queue
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-trust-200">
            Compare each submitted document against the kitchen&apos;s posted
            permit details. Approving is what grants the Verified kitchen badge
            — when in doubt, confirm with the county&apos;s Environmental
            Health division first.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-4 pt-6 sm:px-6">
        {error && (
          <p
            role="alert"
            className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <TriangleAlert size={15} className="shrink-0" />
            {error.includes("403")
              ? "This account isn't on the reviewer allowlist (HOMEPLATE_ADMIN_EMAILS)."
              : "Couldn't load the review queue."}
          </p>
        )}
        {actionError && (
          <p
            role="alert"
            className="mt-3 flex items-center gap-2 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
          >
            <TriangleAlert size={15} className="shrink-0" />
            {actionError}
          </p>
        )}

        {!error && data && queue.length === 0 && (
          <div className="rounded-md border border-zinc-200 bg-white p-10 text-center">
            <Inbox size={28} className="mx-auto text-zinc-300" />
            <p className="mt-3 text-sm font-semibold text-zinc-700">Queue is clear</p>
            <p className="mt-1 text-sm text-zinc-500">
              New permit uploads from kitchens will appear here for review.
            </p>
          </div>
        )}

        <ul className="space-y-4">
          {queue.map((row) => {
            const typedNumber = row.compliance.permitNumber;
            const readNumber = row.extracted?.permitNumber ?? "";
            const numbersMatch =
              Boolean(typedNumber) &&
              Boolean(readNumber) &&
              normalize(typedNumber) === normalize(readNumber);
            return (
              <li
                key={row.id}
                className="overflow-hidden rounded-md border border-zinc-200 bg-white shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3">
                  <div>
                    <p className="text-sm font-bold text-zinc-900">{row.kitchenName}</p>
                    <p className="text-xs text-zinc-500">
                      {row.cookName}
                      {row.locationLabel && <> · {row.locationLabel}</>} · submitted{" "}
                      {new Date(row.submittedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <span className="rounded-sm border border-trust-200 bg-trust-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-trust-700">
                    {PROGRAM_RULES[row.compliance.program].label}
                  </span>
                </div>

                <div className="grid gap-4 p-4 sm:grid-cols-[10rem_1fr]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={row.image}
                    alt={`Permit document for ${row.kitchenName}`}
                    className="h-40 w-full rounded-md border border-zinc-200 object-cover sm:h-full"
                  />

                  <div className="space-y-3 text-sm">
                    {/* Typed vs extracted comparison */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                          Cook typed
                        </p>
                        <p className="mt-1 font-semibold tabular-nums text-zinc-900">
                          {typedNumber || <span className="text-zinc-400">no number</span>}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {row.compliance.permitAgency || "no agency"}
                        </p>
                      </div>
                      <div className="rounded-md border border-trust-100 bg-trust-50 p-3">
                        <p className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-trust-500">
                          <ScanSearch size={12} />
                          Read from document
                          {row.extracted?.confidence && (
                            <span className="font-medium normal-case tracking-normal">
                              · {row.extracted.confidence} confidence
                            </span>
                          )}
                        </p>
                        {row.extracted ? (
                          <>
                            <p className="mt-1 font-semibold tabular-nums text-trust-900">
                              {readNumber || <span className="text-trust-400">no number read</span>}
                            </p>
                            <p className="text-xs text-trust-700">
                              {[
                                row.extracted.issuingAgency,
                                row.extracted.holderName,
                                row.extracted.expirationDate &&
                                  `expires ${row.extracted.expirationDate}`,
                              ]
                                .filter(Boolean)
                                .join(" · ") || "no other fields read"}
                            </p>
                            {!row.extracted.isPermitDocument && (
                              <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-600">
                                <TriangleAlert size={12} />
                                Doesn&apos;t look like a permit document
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="mt-1 text-xs text-trust-500">
                            Auto-extraction unavailable — review the photo manually.
                          </p>
                        )}
                      </div>
                    </div>

                    {typedNumber && readNumber && (
                      <p
                        className={`flex items-center gap-1.5 text-xs font-semibold ${
                          numbersMatch ? "text-sage-700" : "text-amber-700"
                        }`}
                      >
                        {numbersMatch ? (
                          <>
                            <CheckCircle2 size={13} />
                            Permit numbers match
                          </>
                        ) : (
                          <>
                            <TriangleAlert size={13} />
                            Typed and document numbers differ — check before approving
                          </>
                        )}
                      </p>
                    )}

                    {/* Decision row */}
                    <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
                      <input
                        type="text"
                        value={notes[row.id] ?? ""}
                        onChange={(e) => setNotes({ ...notes, [row.id]: e.target.value })}
                        placeholder="Note to the kitchen (required for rejections)"
                        maxLength={300}
                        className="w-full flex-1 rounded-md border border-zinc-200 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:border-trust-400 focus:outline-none sm:w-auto"
                      />
                      <button
                        type="button"
                        disabled={busyId === row.id}
                        onClick={() => decide(row.id, "approve")}
                        className="inline-flex items-center gap-1.5 rounded-md bg-sage-600 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-sage-700 disabled:opacity-50"
                      >
                        <BadgeCheck size={14} />
                        Approve · verify kitchen
                      </button>
                      <button
                        type="button"
                        disabled={busyId === row.id || !(notes[row.id] ?? "").trim()}
                        onClick={() => decide(row.id, "reject")}
                        className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 px-3.5 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-red-300 hover:text-red-600 disabled:opacity-40"
                      >
                        <X size={14} />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
