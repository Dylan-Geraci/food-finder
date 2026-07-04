import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/services/models";

export const dynamic = "force-dynamic";

/** PATCH /api/orders/:id — advance an order through the kitchen queue.
 *  Body: { status: "pending" | "accepted" | "ready" | "completed" | "cancelled" } */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
    const { status } = (await req.json()) ?? {};

    if (!ORDER_STATUSES.includes(status as OrderStatus)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { status } },
      { new: true }
    ).lean();
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({ ok: true, id: String(order._id), status: order.status });
  } catch (err) {
    console.error("[api/orders/:id]", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
