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
        priceEach: o.priceEach || (o.qty ? o.total / o.qty : 0),
        total: o.total,
        type: o.type,
        note: o.note ?? "",
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

/**
 * POST /api/orders — place an order (no payment processing in the MVP).
 * Body: { mealId, dinerKey, qty, type: "pickup" | "delivery", note? }
 */
export async function POST(req: Request) {
  try {
    await connectDb();
    const body = (await req.json()) ?? {};
    const mealId = (body.mealId ?? "").toString();
    const dinerKey = (body.dinerKey ?? "").toString();
    const qty = Number(body.qty);
    const type = body.type === "delivery" ? "delivery" : "pickup";
    const note = (body.note ?? "").toString().trim().slice(0, 300);

    if (!mealId || !dinerKey || !Number.isInteger(qty) || qty < 1 || qty > 20) {
      return NextResponse.json(
        { error: "mealId, dinerKey and a quantity between 1 and 20 are required" },
        { status: 400 }
      );
    }

    const diner = await User.findOne({ key: dinerKey }).lean();
    if (!diner) return NextResponse.json({ error: "Account not found" }, { status: 404 });
    if (diner.role !== "diner") {
      return NextResponse.json(
        { error: "Business accounts can't place orders" },
        { status: 403 }
      );
    }

    // Atomically claim servings so two diners can't oversell a dish
    const meal = await Meal.findOneAndUpdate(
      { _id: mealId, available: true, servingsLeft: { $gte: qty } },
      { $inc: { servingsLeft: -qty } },
      { new: true }
    ).lean();
    if (!meal) {
      return NextResponse.json(
        { error: "Not enough servings left — lower the quantity or check back later" },
        { status: 409 }
      );
    }

    const order = await Order.create({
      dinerId: diner._id,
      cookId: meal.cookId,
      mealId: meal._id,
      qty,
      priceEach: meal.price,
      total: Math.round(meal.price * qty * 100) / 100,
      type,
      note,
      status: "pending",
      placedAt: new Date(),
    });

    return NextResponse.json(
      {
        ok: true,
        order: {
          id: String(order._id),
          status: order.status,
          total: order.total,
          servingsLeft: meal.servingsLeft,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/orders POST]", err);
    return NextResponse.json({ error: "Failed to place order" }, { status: 500 });
  }
}
