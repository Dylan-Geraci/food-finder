import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { isMediaString } from "@/services/media";
import { CookProfile, Meal, Review, User } from "@/services/models";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/cooks/:id — kitchen identity management.
 * Body (all optional): { kitchenName, bio, banner, icon }
 * Media fields accept a compressed data URL, an http(s) URL, or "" to clear.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
    const body = (await req.json()) ?? {};

    const update: Record<string, unknown> = {};
    if (typeof body.kitchenName === "string" && body.kitchenName.trim())
      update.kitchenName = body.kitchenName.trim().slice(0, 80);
    if (typeof body.bio === "string") update.bio = body.bio.trim().slice(0, 600);
    if ("banner" in body && isMediaString(body.banner)) update.banner = body.banner;
    if ("icon" in body && isMediaString(body.icon)) update.icon = body.icon;

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const cook = await CookProfile.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!cook) return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });

    return NextResponse.json({ ok: true, cook: { id: String(cook._id) } });
  } catch (err) {
    console.error("[api/cooks/:id PATCH]", err);
    return NextResponse.json({ error: "Failed to update kitchen" }, { status: 500 });
  }
}

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
        banner: cook.banner ?? "",
        icon: cook.icon ?? "",
        location: cook.location,
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
        photos: m.photos ?? [],
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
