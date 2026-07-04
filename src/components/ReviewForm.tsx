"use client";

import { useState } from "react";
import { LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { StarPicker } from "./RatingStars";

interface MealOption {
  id: string;
  title: string;
}

/** Review submission — half-star picker + comment box. */
export function ReviewForm({
  meals,
  onSubmitted,
}: {
  meals: MealOption[];
  onSubmitted: () => void;
}) {
  const { status, user, openAuth } = useAuth();
  const [mealId, setMealId] = useState(meals[0]?.id ?? "");
  const [stars, setStars] = useState(5.0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (meals.length === 0) return null;
  if (status === "guest") {
    return (
      <div className="flex items-center justify-between gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3.5">
        <p className="text-sm text-zinc-600">Log in to leave a review.</p>
        <button
          onClick={() => openAuth("login")}
          className="inline-flex items-center gap-1.5 rounded-md bg-accent-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-700"
        >
          <LogIn size={14} />
          Log in
        </button>
      </div>
    );
  }
  if (!user) return null;
  if (user.role !== "diner") {
    return (
      <p className="rounded-md border border-zinc-200 bg-zinc-50 p-3.5 text-sm text-zinc-500">
        Business accounts can&apos;t post reviews — log in as a diner to review this kitchen.
      </p>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealId, dinerKey: user!.key, stars, comment }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to submit");
      setComment("");
      setStars(5.0);
      setMessage("Review posted. Ratings updated.");
      onSubmitted();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      onSubmit={submit}
      className="space-y-3.5 rounded-md border border-zinc-200 bg-white p-4 shadow-sm"
    >
      <h3 className="font-semibold text-zinc-900">
        Leave a review{" "}
        <span className="font-normal text-zinc-400">as {user.name}</span>
      </h3>
      <select
        value={mealId}
        onChange={(e) => setMealId(e.target.value)}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-accent-600 focus:outline-none"
      >
        {meals.map((m) => (
          <option key={m.id} value={m.id}>
            {m.title}
          </option>
        ))}
      </select>
      <StarPicker value={stars} onChange={setStars} />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="How was it?"
        rows={2}
        className="w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none"
      />
      <button
        type="submit"
        disabled={busy || !mealId}
        className="w-full rounded-md bg-accent-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
      >
        {busy ? "Posting..." : "Post review"}
      </button>
      {message && <p className="text-center text-sm text-zinc-500">{message}</p>}
    </form>
  );
}
