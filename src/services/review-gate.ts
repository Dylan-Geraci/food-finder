/**
 * Operator review-queue gate. The permit review endpoints are operator
 * tooling; access follows the repo's env-var activation pattern:
 *
 *   HOMEPLATE_ADMIN_EMAILS="ops@example.com,dylan@example.com"
 *
 * When the variable is unset (local dev default) the queue is open, like
 * the rest of the mock-auth MVP. Setting it restricts review actions to
 * the listed account emails.
 */
export function isAuthorizedReviewer(email: string | null | undefined): boolean {
  const allowlist = (process.env.HOMEPLATE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  if (allowlist.length === 0) return true;
  return Boolean(email) && allowlist.includes(String(email).toLowerCase());
}
