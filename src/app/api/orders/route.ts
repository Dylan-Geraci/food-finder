import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { CookProfile, Meal, Order, User } from "@/services/models";

export const dynamic = "force-dynamic";

/**
 * GET /api/orders?dinerKey=... — a diner's order history (newest first)
 * GET /api/orders?cookId=...  — a kitchen's order queue + history
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

    const orders = await Order.find(filter).sort({ placedAt: -1 }).lean();

    const [meals, cooks, diners] = await Promise.all([
      Meal.find({ _id: { $in: orders.map((o) => o.mealId) } })
        .select("title image")
        .lean(),
      CookProfile.find({ _id: { $in: orders.map((o) => o.cookId) } })
        .select("kitchenName")
        .lean(),
      User.find({ _id: { $in: orders.map((o) => o.dinerId) } })
        .select("name")
        .lean(),
    ]);
    const mealById = new Map(meals.map((m) => [String(m._id), m]));
    const cookById = new Map(cooks.map((c) => [String(c._id), c]));
    const dinerById = new Map(diners.map((d) => [String(d._id), d]));

    return NextResponse.json({
      orders: orders.map((o) => ({
        id: String(o._id),
        qty: o.qty,
        total: o.total,
        type: o.type,
        status: o.status,
        placedAt: o.placedAt,
        mealId: String(o.mealId),
        mealTitle: mealById.get(String(o.mealId))?.title ?? "Removed meal",
        mealImage: mealById.get(String(o.mealId))?.image ?? "",
        cookId: String(o.cookId),
        kitchenName: cookById.get(String(o.cookId))?.kitchenName ?? "Unknown kitchen",
        dinerName: dinerById.get(String(o.dinerId))?.name ?? "Unknown diner",
      })),
    });
  } catch (err) {
    console.error("[api/orders]", err);
    return NextResponse.json({ error: "Failed to load orders" }, { status: 500 });
  }
}
