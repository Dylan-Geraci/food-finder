import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { User } from "@/services/models";

export const dynamic = "force-dynamic";

/** GET /api/users — all users, for the mock-auth account switcher. */
export async function GET() {
  try {
    await connectDb();
    const users = await User.find().lean();
    return NextResponse.json({
      users: users.map((u) => ({
        id: String(u._id),
        key: u.key,
        name: u.name,
        email: u.email,
        role: u.role,
        joinedAt: u.joinedAt,
      })),
    });
  } catch (err) {
    console.error("[api/users]", err);
    return NextResponse.json({ error: "Failed to load users" }, { status: 500 });
  }
}
