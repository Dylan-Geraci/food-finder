import { Avatar } from "./Avatar";
import { RatingStars } from "./RatingStars";

export interface ReviewData {
  id: string;
  mealTitle: string;
  stars: number;
  comment: string;
  createdAt: string;
  dinerName: string;
}

function timeAgo(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days} days ago`;
  return `${Math.floor(days / 30)} mo ago`;
}

/** Structured review list — uniform star metrics, hairline-bordered rows. */
export function ReviewList({ reviews }: { reviews: ReviewData[] }) {
  if (reviews.length === 0) {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-center text-sm text-zinc-500">
        No reviews yet.
      </p>
    );
  }
  return (
    <ul className="divide-y divide-zinc-200 rounded-md border border-zinc-200 bg-white shadow-sm">
      {reviews.map((r) => (
        <li key={r.id} className="p-4">
          <div className="flex items-center gap-3">
            <Avatar name={r.dinerName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-zinc-900">{r.dinerName}</p>
              <p className="text-xs text-zinc-400">
                {timeAgo(r.createdAt)} &middot; {r.mealTitle}
              </p>
            </div>
            <RatingStars avg={r.stars} count={1} showCount={false} size={12} />
          </div>
          {r.comment && (
            <p className="mt-2.5 text-sm leading-relaxed text-zinc-600">{r.comment}</p>
          )}
        </li>
      ))}
    </ul>
  );
}
