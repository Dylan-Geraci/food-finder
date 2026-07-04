import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { User } from "@/services/models";
import { buildSessionPayload } from "@/services/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login — mock authentication by email lookup.
 * Body: { email: string }. No passwords in the MVP; real auth comes later.
 */
export async function POST(req: Request) {
  try {
    await connectDb();
    const { email } = (await req.json()) ?? {};
    if (typeof email !== "string" || !email.trim()) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "No account found for that email" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: await buildSessionPayload(user) });
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
