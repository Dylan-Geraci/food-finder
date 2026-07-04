import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { CookProfile, Meal } from "@/services/models";

// Verified generic food image used when a new listing has no photo yet
const DEFAULT_MEAL_IMAGE =
  "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=60";

export const dynamic = "force-dynamic";

/** GET /api/meals — all meals joined with their cook's kitchen + location. */
export async function GET() {
  try {
    await connectDb();
    const [meals, cooks] = await Promise.all([
      Meal.find().sort({ available: -1, ratingAvg: -1 }).lean(),
      CookProfile.find().lean(),
    ]);
    const cookById = new Map(cooks.map((c) => [String(c._id), c]));

    const payload = meals.map((m) => {
      const cook = cookById.get(String(m.cookId));
      return {
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
        cookId: String(m.cookId),
        kitchenName: cook?.kitchenName ?? "Unknown kitchen",
        cuisines: cook?.cuisines ?? [],
        location: cook?.location ?? null,
      };
    });

    return NextResponse.json({ meals: payload });
  } catch (err) {
    console.error("[api/meals]", err);
    return NextResponse.json({ error: "Failed to load meals" }, { status: 500 });
  }
}

/** POST /api/meals — create a new listing (kitchen dashboard).
 *  Body: { cookId, title, price, prepMinutes?, description?, tags?, servingsLeft? } */
export async function POST(req: Request) {
  try {
    await connectDb();
    const body = (await req.json()) ?? {};
    const cookId = (body.cookId ?? "").toString();
    const title = (body.title ?? "").toString().trim();
    const price = Number(body.price);

    if (!cookId || !title || !Number.isFinite(price) || price < 0) {
      return NextResponse.json(
        { error: "cookId, title and a non-negative price are required" },
        { status: 400 }
      );
    }
    const cook = await CookProfile.findById(cookId).select("_id").lean();
    if (!cook) return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });

    const meal = await Meal.create({
      key: `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "meal"}-${Date.now().toString(36)}`,
      cookId: cook._id,
      title: title.slice(0, 120),
      description: (body.description ?? "").toString().trim().slice(0, 600),
      price: Math.round(price * 100) / 100,
      prepMinutes:
        Number.isFinite(Number(body.prepMinutes)) && Number(body.prepMinutes) >= 0
          ? Math.floor(Number(body.prepMinutes))
          : 30,
      image: DEFAULT_MEAL_IMAGE,
      tags: Array.isArray(body.tags) ? body.tags.slice(0, 6).map(String) : [],
      servingsLeft:
        Number.isFinite(Number(body.servingsLeft)) && Number(body.servingsLeft) >= 0
          ? Math.floor(Number(body.servingsLeft))
          : 5,
      available: true,
      ratingAvg: 0.0,
      ratingCount: 0,
    });

    return NextResponse.json({ ok: true, mealId: String(meal._id) }, { status: 201 });
  } catch (err) {
    console.error("[api/meals POST]", err);
    return NextResponse.json({ error: "Failed to create meal" }, { status: 500 });
  }
}
