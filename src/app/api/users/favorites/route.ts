import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { CookProfile, User } from "@/services/models";

export const dynamic = "force-dynamic";

/** POST /api/users/favorites — toggle a saved kitchen.
 *  Body: { userKey, cookId, action: "add" | "remove" } */
export async function POST(req: Request) {
  try {
    await connectDb();
    const { userKey, cookId, action } = (await req.json()) ?? {};

    if (!userKey || !cookId || !["add", "remove"].includes(action)) {
      return NextResponse.json(
        { error: "userKey, cookId and action (add|remove) are required" },
        { status: 400 }
      );
    }
    if (action === "add" && !(await CookProfile.exists({ _id: cookId }))) {
      return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });
    }

    const user = await User.findOneAndUpdate(
      { key: userKey },
      action === "add"
        ? { $addToSet: { favoriteCookIds: cookId } }
        : { $pull: { favoriteCookIds: cookId } },
      { new: true }
    ).lean();
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    return NextResponse.json({
      ok: true,
      favoriteCookIds: (user.favoriteCookIds ?? []).map(String),
    });
  } catch (err) {
    console.error("[api/users/favorites]", err);
    return NextResponse.json({ error: "Failed to update favorites" }, { status: 500 });
  }
}
