import { NextResponse } from "next/server";
import { connectDb } from "@/services/db";
import { User } from "@/services/models";
import { verifyPassword } from "@/services/password";
import { buildSessionPayload } from "@/services/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/auth/login — email lookup, plus password verification for
 * accounts that have one. Body: { email, password? }.
 * Seeded demo accounts are passwordless and log in by email alone;
 * accounts created through signup carry a password hash and must match.
 */
export async function POST(req: Request) {
  try {
    await connectDb();
    const body = (await req.json()) ?? {};
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).lean();
    if (!user) {
      return NextResponse.json(
        { error: "No account found for that email" },
        { status: 404 }
      );
    }

    // `restore: true` re-validates a locally persisted session on page
    // load (mock persistence — there are no tokens in the demo); the
    // password gate applies to interactive logins.
    const isRestore = body.restore === true;

    if (user.passwordHash && !isRestore) {
      if (!password) {
        return NextResponse.json(
          { error: "This account has a password — enter it to log in", needsPassword: true },
          { status: 401 }
        );
      }
      if (!verifyPassword(password, user.passwordHash)) {
        return NextResponse.json(
          { error: "Incorrect password", needsPassword: true },
          { status: 401 }
        );
      }
    }

    return NextResponse.json({ user: await buildSessionPayload(user) });
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
