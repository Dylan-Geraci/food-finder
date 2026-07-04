import { CheckCircle2, ChefHat, CircleDashed, PackageCheck, XCircle } from "lucide-react";

const STYLES: Record<string, { label: string; className: string; Icon: typeof CheckCircle2 }> = {
  pending: {
    label: "Pending",
    className: "border-amber-200 bg-amber-50 text-amber-700",
    Icon: CircleDashed,
  },
  accepted: {
    label: "In the kitchen",
    className: "border-sky-200 bg-sky-50 text-sky-700",
    Icon: ChefHat,
  },
  ready: {
    label: "Ready",
    className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: PackageCheck,
  },
  completed: {
    label: "Completed",
    className: "border-zinc-200 bg-zinc-50 text-zinc-600",
    Icon: CheckCircle2,
  },
  cancelled: {
    label: "Cancelled",
    className: "border-red-200 bg-red-50 text-red-600",
    Icon: XCircle,
  },
};

/** Uniform order-status chip used by both the diner and kitchen dashboards. */
export function OrderStatusBadge({ status }: { status: string }) {
  const s = STYLES[status] ?? STYLES.pending;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${s.className}`}
    >
      <s.Icon size={12} />
      {s.label}
    </span>
  );
}
