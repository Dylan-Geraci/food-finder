import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/auth/oauth-status — which OAuth providers have credentials.
 * Reads env directly (no NextAuth import) so the auth modal can cheaply
 * decide whether to enable its provider buttons.
 */
export async function GET() {
  return NextResponse.json({
    google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
    apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
  });
}
