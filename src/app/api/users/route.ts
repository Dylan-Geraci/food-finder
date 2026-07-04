import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { User } from "@/services/models";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/users — update the signed-in user's editable account fields.
 * Body: { key, name } (mock auth: the session's stable key identifies the user).
 */
export async function PATCH(req: Request) {
  try {
    await connectDb();
    const body = (await req.json()) ?? {};
    const key = (body.key ?? "").toString().trim();
    const name = (body.name ?? "").toString().trim();

    if (!key) {
      return NextResponse.json({ error: "Missing user key" }, { status: 400 });
    }
    if (!name || name.length > 60) {
      return NextResponse.json(
        { error: "Name is required (60 characters max)" },
        { status: 400 }
      );
    }

    const user = await User.findOneAndUpdate(
      { key },
      { $set: { name } },
      { new: true }
    ).lean();
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, name: user.name });
  } catch (err) {
    console.error("[api/users PATCH]", err);
    return NextResponse.json({ error: "Failed to update account" }, { status: 500 });
  }
}

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
