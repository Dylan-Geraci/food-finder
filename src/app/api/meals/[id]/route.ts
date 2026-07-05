import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { DEFAULT_MEAL_IMAGE, isMediaString } from "@/services/media";
import { Meal, Review } from "@/services/models";
import { recomputeCookRating } from "@/services/seed";

export const dynamic = "force-dynamic";

/** PATCH /api/meals/:id — kitchen listing management.
 *  Body (all optional): { available, price, servingsLeft, title, description, prepMinutes, photos } */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
    const body = (await req.json()) ?? {};

    const update: Record<string, unknown> = {};
    if (typeof body.available === "boolean") update.available = body.available;
    if (typeof body.price === "number" && body.price >= 0) update.price = body.price;
    if (typeof body.servingsLeft === "number" && body.servingsLeft >= 0)
      update.servingsLeft = Math.floor(body.servingsLeft);
    if (typeof body.prepMinutes === "number" && body.prepMinutes >= 0)
      update.prepMinutes = Math.floor(body.prepMinutes);
    if (typeof body.title === "string" && body.title.trim())
      update.title = body.title.trim().slice(0, 120);
    if (typeof body.description === "string")
      update.description = body.description.trim().slice(0, 600);
    if (Array.isArray(body.tags)) update.tags = body.tags.slice(0, 6).map(String);
    if (Array.isArray(body.photos)) {
      const photos = body.photos.filter(isMediaString).filter(Boolean).slice(0, 2);
      update.photos = photos;
      update.image = photos[0] ?? DEFAULT_MEAL_IMAGE; // keep card consumers in sync
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const meal = await Meal.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });

    return NextResponse.json({ ok: true, meal: { id: String(meal._id) } });
  } catch (err) {
    console.error("[api/meals/:id PATCH]", err);
    return NextResponse.json({ error: "Failed to update meal" }, { status: 500 });
  }
}

/** DELETE /api/meals/:id — remove a listing (and its reviews), then
 *  recompute the cook's aggregate rating. */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    const meal = await Meal.findByIdAndDelete(id).lean();
    if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });

    await Review.deleteMany({ mealId: meal._id });
    await recomputeCookRating(meal.cookId);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/meals/:id DELETE]", err);
    return NextResponse.json({ error: "Failed to delete meal" }, { status: 500 });
  }
}
