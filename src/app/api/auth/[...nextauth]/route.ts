import { handlers } from "@/services/oauth";

/**
 * NextAuth catch-all (signin, callback, session, providers, ...).
 * The explicit /api/auth/login and /api/auth/signup mock routes are more
 * specific segments, so Next.js keeps routing them ahead of this handler.
 */
export const { GET, POST } = handlers;
