import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { CookProfile, Meal, Review, User } from "@/services/models";
import { recomputeCookRating, recomputeMealRating } from "@/services/seed";
import { clampStars, MAX_STARS, MIN_STARS } from "@/services/rating";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews?dinerKey=... — a diner's review history
 * GET /api/reviews?cookId=...  — all reviews for a kitchen (rating analytics)
 */
export async function GET(req: Request) {
  try {
    await connectDb();
    const url = new URL(req.url);
    const dinerKey = url.searchParams.get("dinerKey");
    const cookId = url.searchParams.get("cookId");

    let filter: Record<string, unknown>;
    if (dinerKey) {
      const diner = await User.findOne({ key: dinerKey }).select("_id").lean();
      if (!diner) return NextResponse.json({ error: "User not found" }, { status: 404 });
      filter = { dinerId: diner._id };
    } else if (cookId) {
      filter = { cookId };
    } else {
      return NextResponse.json({ error: "dinerKey or cookId is required" }, { status: 400 });
    }

    const reviews = await Review.find(filter).sort({ createdAt: -1 }).lean();
    const [meals, cooks, diners] = await Promise.all([
      Meal.find({ _id: { $in: reviews.map((r) => r.mealId) } })
        .select("title")
        .lean(),
      CookProfile.find({ _id: { $in: reviews.map((r) => r.cookId) } })
        .select("kitchenName")
        .lean(),
      User.find({ _id: { $in: reviews.map((r) => r.dinerId) } })
        .select("name")
        .lean(),
    ]);
    const mealById = new Map(meals.map((m) => [String(m._id), m]));
    const cookById = new Map(cooks.map((c) => [String(c._id), c]));
    const dinerById = new Map(diners.map((d) => [String(d._id), d]));

    return NextResponse.json({
      reviews: reviews.map((r) => ({
        id: String(r._id),
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
        mealTitle: mealById.get(String(r.mealId))?.title ?? "Removed meal",
        kitchenName: cookById.get(String(r.cookId))?.kitchenName ?? "Unknown kitchen",
        cookId: String(r.cookId),
        dinerName: dinerById.get(String(r.dinerId))?.name ?? "Anonymous",
      })),
    });
  } catch (err) {
    console.error("[api/reviews GET]", err);
    return NextResponse.json({ error: "Failed to load reviews" }, { status: 500 });
  }
}

/**
 * POST /api/reviews — submit a review and recompute denormalized ratings.
 * Body: { mealId: string, dinerKey: string, stars: number, comment?: string }
 * (dinerKey identifies the mock-auth user; real auth comes later.)
 */
export async function POST(req: Request) {
  try {
    await connectDb();
    const body = await req.json();
    const { mealId, dinerKey, stars, comment } = body ?? {};

    if (!mealId || !dinerKey || typeof stars !== "number") {
      return NextResponse.json(
        { error: "mealId, dinerKey and numeric stars are required" },
        { status: 400 }
      );
    }
    if (stars < MIN_STARS || stars > MAX_STARS) {
      return NextResponse.json(
        { error: `stars must be between ${MIN_STARS} and ${MAX_STARS}` },
        { status: 400 }
      );
    }

    const [meal, diner] = await Promise.all([
      Meal.findById(mealId).lean(),
      User.findOne({ key: dinerKey }).lean(),
    ]);
    if (!meal) return NextResponse.json({ error: "Meal not found" }, { status: 404 });
    if (!diner) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const review = await Review.create({
      mealId: meal._id,
      cookId: meal.cookId,
      dinerId: diner._id,
      stars: clampStars(stars),
      comment: (comment ?? "").toString().slice(0, 1000),
    });

    // Keep denormalized aggregates in sync
    await recomputeMealRating(meal._id);
    await recomputeCookRating(meal.cookId);

    return NextResponse.json({ ok: true, reviewId: String(review._id) }, { status: 201 });
  } catch (err) {
    console.error("[api/reviews]", err);
    return NextResponse.json({ error: "Failed to submit review" }, { status: 500 });
  }
}
