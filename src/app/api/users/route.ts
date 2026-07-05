import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { User } from "@/services/models";
import { hashPassword, verifyPassword } from "@/services/password";
import { passwordProblems } from "@/services/password-rules";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/users — update the signed-in user's editable account fields.
 * Body: { key, name?, currentPassword?, newPassword? }
 * (mock auth: the session's stable key identifies the user).
 * Setting a new password enforces the standard strength rules, and
 * accounts that already have one must present it.
 */
export async function PATCH(req: Request) {
  try {
    await connectDb();
    const body = (await req.json()) ?? {};
    const key = (body.key ?? "").toString().trim();

    if (!key) {
      return NextResponse.json({ error: "Missing user key" }, { status: 400 });
    }
    const user = await User.findOne({ key });
    if (!user) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    const name = typeof body.name === "string" ? body.name.trim() : undefined;
    const newPassword = typeof body.newPassword === "string" ? body.newPassword : "";

    if (name !== undefined) {
      if (!name || name.length > 60) {
        return NextResponse.json(
          { error: "Name is required (60 characters max)" },
          { status: 400 }
        );
      }
      user.name = name;
    }

    if (newPassword) {
      const problems = passwordProblems(newPassword);
      if (problems.length > 0) {
        return NextResponse.json(
          { error: `Password needs: ${problems.join(", ").toLowerCase()}` },
          { status: 400 }
        );
      }
      if (user.passwordHash) {
        const current =
          typeof body.currentPassword === "string" ? body.currentPassword : "";
        if (!current || !verifyPassword(current, user.passwordHash)) {
          return NextResponse.json(
            { error: "Current password is incorrect" },
            { status: 401 }
          );
        }
      }
      user.passwordHash = hashPassword(newPassword);
    }

    if (name === undefined && !newPassword) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    await user.save();
    return NextResponse.json({ ok: true });
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
