import NextAuth from "next-auth";
import type { Provider } from "next-auth/providers";
import Apple from "next-auth/providers/apple";
import Google from "next-auth/providers/google";

/**
 * OAuth infrastructure (NextAuth v5 / Auth.js) — scaffolding.
 *
 * Providers activate purely through environment variables (see
 * .env.example): with none configured the routes exist but every entry
 * point in the UI stays disabled, and the mock email login remains the
 * only active auth path. Nothing here touches the mock flow.
 *
 * Provider credentials follow Auth.js conventions and are read
 * automatically: AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET and
 * AUTH_APPLE_ID / AUTH_APPLE_SECRET.
 */

export const oauthStatus = {
  google: Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET),
  apple: Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET),
};

const providers: Provider[] = [];
if (oauthStatus.google) providers.push(Google);
if (oauthStatus.apple) providers.push(Apple);

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers,
  // Dev fallback so unconfigured installs never crash the route; set a
  // real AUTH_SECRET (npx auth secret) before enabling any provider.
  secret: process.env.AUTH_SECRET ?? "homeplate-dev-only-secret-set-AUTH_SECRET",
  trustHost: true,
  callbacks: {
    // Bridge point for going live: upsert a User document here by
    // verified email (role selection on first sign-in), then surface its
    // session key so AuthContext treats OAuth and mock sessions as one
    // account model. Left as a pass-through while scaffolding.
    async signIn() {
      return true;
    },
  },
});
