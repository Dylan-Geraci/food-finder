import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { CookProfile, Meal, User } from "@/services/models";

export const dynamic = "force-dynamic";

/** GET /api/cooks — all cook profiles with user info + active meal counts. */
export async function GET() {
  try {
    await connectDb();
    const [cooks, users, meals] = await Promise.all([
      CookProfile.find().lean(),
      User.find({ role: "cook" }).lean(),
      Meal.find({ available: true }).select("cookId").lean(),
    ]);

    const userById = new Map(users.map((u) => [String(u._id), u]));
    const mealCounts = new Map<string, number>();
    for (const m of meals) {
      const k = String(m.cookId);
      mealCounts.set(k, (mealCounts.get(k) ?? 0) + 1);
    }

    const payload = cooks.map((c) => ({
      id: String(c._id),
      kitchenName: c.kitchenName,
      bio: c.bio,
      portrait: c.portrait ?? "",
      banner: c.banner ?? "",
      icon: c.icon ?? "",
      location: c.location,
      certifications: c.certifications,
      cuisines: c.cuisines,
      ratingAvg: c.ratingAvg,
      ratingCount: c.ratingCount,
      activeMeals: mealCounts.get(String(c._id)) ?? 0,
      cookName: userById.get(String(c.userId))?.name ?? "Unknown cook",
    }));

    return NextResponse.json({ cooks: payload });
  } catch (err) {
    console.error("[api/cooks]", err);
    return NextResponse.json({ error: "Failed to load cooks" }, { status: 500 });
  }
}
