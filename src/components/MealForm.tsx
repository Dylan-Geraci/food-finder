"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { MediaUpload } from "./MediaUpload";

/**
 * Meal listing editor — one form for creating and editing dishes.
 * Every input is explicitly labeled with helper text so a kitchen owner
 * instantly knows what each field controls and where it shows up.
 */

const PRESET_TAGS = [
  "gluten-free",
  "vegetarian",
  "vegan",
  "pescatarian",
  "dairy-free",
  "contains-nuts",
  "contains-peanuts",
  "spicy",
] as const;

export interface MealFormMeal {
  id: string;
  title: string;
  description: string;
  price: number;
  prepMinutes: number;
  servingsLeft: number;
  tags: string[];
  photos: string[];
  image: string;
}

export type MealFormTarget = { mode: "create" } | { mode: "edit"; meal: MealFormMeal };

const inputClass =
  "w-full rounded-md border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-accent-600 focus:outline-none";
const labelClass = "mb-1 block text-sm font-medium text-zinc-700";
const helpClass = "mt-1 text-[11px] leading-snug text-zinc-400";

export function MealFormModal({
  target,
  cookId,
  onClose,
  onSaved,
}: {
  target: MealFormTarget | null;
  cookId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const open = target !== null;
  const editing = target?.mode === "edit" ? target.meal : null;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [prepMinutes, setPrepMinutes] = useState("30");
  const [servings, setServings] = useState("5");
  const [tags, setTags] = useState<string[]>([]);
  const [photos, setPhotos] = useState<[string, string]>(["", ""]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Hydrate the form whenever a target is chosen
  useEffect(() => {
    if (!target) return;
    if (target.mode === "edit") {
      const m = target.meal;
      setTitle(m.title);
      setDescription(m.description);
      setPrice(String(m.price));
      setPrepMinutes(String(m.prepMinutes));
      setServings(String(m.servingsLeft));
      setTags(m.tags ?? []);
      setPhotos([m.photos[0] ?? m.image ?? "", m.photos[1] ?? ""]);
    } else {
      setTitle("");
      setDescription("");
      setPrice("");
      setPrepMinutes("30");
      setServings("5");
      setTags([]);
      setPhotos(["", ""]);
    }
    setError(null);
  }, [target]);

  // Lock body scroll while open; close on Escape
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  function toggleTag(tag: string) {
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      setError("Enter a valid price (0 or more).");
      return;
    }
    setBusy(true);
    setError(null);
    const payload = {
      title,
      description,
      price: priceNum,
      prepMinutes: Number(prepMinutes) || 0,
      servingsLeft: Number(servings) || 0,
      tags,
      photos: photos.filter(Boolean),
    };
    try {
      const res = editing
        ? await fetch(`/api/meals/${editing.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/meals", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...payload, cookId }),
          });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Failed to save listing");
      } else {
        onSaved();
        onClose();
      }
    } catch {
      setError("Network error — is the server running?");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={editing ? `Edit ${editing.title}` : "New meal listing"}
    >
      <button aria-label="Close" className="absolute inset-0 bg-zinc-950/45" onClick={onClose} />
      <div className="menu-pop relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-lg border border-zinc-200 bg-white shadow-2xl sm:w-[500px] sm:rounded-md">
        <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-zinc-900">
              {editing ? "Edit listing" : "New listing"}
            </h2>
            <p className="text-xs text-zinc-400">
              {editing ? "Changes go live immediately." : "Your dish appears on the marketplace as soon as you publish."}
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1.5 text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={save} className="flex-1 space-y-5 overflow-y-auto p-5">
          {/* Photos */}
          <div className="grid grid-cols-2 gap-3">
            <MediaUpload
              label="Cover photo"
              hint="Shown on cards and your menu"
              value={photos[0]}
              onChange={(v) => setPhotos(([, p2]) => [v, p2])}
              maxDim={1200}
              aspectClass="aspect-[4/3]"
            />
            <MediaUpload
              label="Second photo (optional)"
              hint="Diners see it on hover"
              value={photos[1]}
              onChange={(v) => setPhotos(([p1]) => [p1, v])}
              maxDim={1200}
              aspectClass="aspect-[4/3]"
            />
          </div>

          {/* Name */}
          <div>
            <label htmlFor="meal-title" className={labelClass}>
              Dish name
            </label>
            <input
              id="meal-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Chicken Tinga Tacos (3-pack)"
              maxLength={120}
              required
              className={inputClass}
            />
            <p className={helpClass}>The listing title diners see everywhere.</p>
          </div>

          {/* Description */}
          <div>
            <label htmlFor="meal-description" className={labelClass}>
              Description
            </label>
            <textarea
              id="meal-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's in it, how you make it, and what makes it yours."
              rows={2}
              maxLength={600}
              className={inputClass}
            />
            <p className={helpClass}>Shown on your kitchen page under the dish.</p>
          </div>

          {/* Numbers row */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="meal-price" className={labelClass}>
                Price
              </label>
              <div className="flex items-center rounded-md border border-zinc-200 bg-white focus-within:border-accent-600">
                <span className="pl-3 text-sm text-zinc-400">$</span>
                <input
                  id="meal-price"
                  type="number"
                  inputMode="decimal"
                  min="0"
                  step="0.5"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="12.00"
                  required
                  className="w-full bg-transparent px-2 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none"
                />
              </div>
              <p className={helpClass}>Per serving.</p>
            </div>
            <div>
              <label htmlFor="meal-prep" className={labelClass}>
                Prep time
              </label>
              <div className="flex items-center rounded-md border border-zinc-200 bg-white focus-within:border-accent-600">
                <input
                  id="meal-prep"
                  type="number"
                  inputMode="numeric"
                  min="0"
                  step="5"
                  value={prepMinutes}
                  onChange={(e) => setPrepMinutes(e.target.value)}
                  required
                  className="w-full bg-transparent px-3 py-2.5 text-sm text-zinc-900 focus:outline-none"
                />
                <span className="pr-3 text-sm text-zinc-400">min</span>
              </div>
              <p className={helpClass}>Order to ready.</p>
            </div>
            <div>
              <label htmlFor="meal-servings" className={labelClass}>
                Servings
              </label>
              <input
                id="meal-servings"
                type="number"
                inputMode="numeric"
                min="0"
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                required
                className={inputClass}
              />
              <p className={helpClass}>Ordering pauses at 0.</p>
            </div>
          </div>

          {/* Dietary tags */}
          <div>
            <span className={labelClass}>Dietary labels</span>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_TAGS.map((tag) => {
                const active = tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    aria-pressed={active}
                    className={`rounded-sm border px-2 py-1 text-xs font-medium transition-colors ${
                      active
                        ? "border-accent-600 bg-accent-50 text-accent-700"
                        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
            <p className={helpClass}>Pick everything that applies — shown as labels on the card.</p>
          </div>

          {error && (
            <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <div className="flex gap-2 border-t border-zinc-100 pt-4">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 rounded-md bg-accent-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-700 disabled:opacity-50"
            >
              {busy ? "Saving..." : editing ? "Save changes" : "Publish listing"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition-colors hover:border-zinc-400"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
