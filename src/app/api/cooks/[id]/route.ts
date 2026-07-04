import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { CookProfile, Meal, Review, User } from "@/services/models";

export const dynamic = "force-dynamic";

/** GET /api/cooks/:id — full cook profile with meals and reviews. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;

    const cook = await CookProfile.findById(id).lean();
    if (!cook) {
      return NextResponse.json({ error: "Cook not found" }, { status: 404 });
    }

    const [user, meals, reviews] = await Promise.all([
      User.findById(cook.userId).lean(),
      Meal.find({ cookId: cook._id }).lean(),
      Review.find({ cookId: cook._id }).sort({ createdAt: -1 }).lean(),
    ]);

    const dinerIds = [...new Set(reviews.map((r) => String(r.dinerId)))];
    const diners = await User.find({ _id: { $in: dinerIds } }).lean();
    const dinerById = new Map(diners.map((d) => [String(d._id), d]));
    const mealById = new Map(meals.map((m) => [String(m._id), m]));

    return NextResponse.json({
      cook: {
        id: String(cook._id),
        kitchenName: cook.kitchenName,
        bio: cook.bio,
        portrait: cook.portrait ?? "",
        location: cook.location,
        certifications: cook.certifications,
        operatingHours: cook.operatingHours ?? [],
        cuisines: cook.cuisines,
        ratingAvg: cook.ratingAvg,
        ratingCount: cook.ratingCount,
        cookName: user?.name ?? "Unknown cook",
      },
      meals: meals.map((m) => ({
        id: String(m._id),
        key: m.key,
        title: m.title,
        description: m.description,
        price: m.price,
        prepMinutes: m.prepMinutes,
        image: m.image,
        tags: m.tags,
        servingsLeft: m.servingsLeft,
        available: m.available,
        ratingAvg: m.ratingAvg,
        ratingCount: m.ratingCount,
      })),
      reviews: reviews.map((r) => ({
        id: String(r._id),
        mealId: String(r.mealId),
        mealTitle: mealById.get(String(r.mealId))?.title ?? "",
        stars: r.stars,
        comment: r.comment,
        createdAt: r.createdAt,
        dinerName: dinerById.get(String(r.dinerId))?.name ?? "Anonymous",
      })),
    });
  } catch (err) {
    console.error("[api/cooks/:id]", err);
    return NextResponse.json({ error: "Failed to load cook" }, { status: 500 });
  }
}
