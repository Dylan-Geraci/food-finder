/**
 * Password strength rules — isomorphic so the signup form can show a live
 * checklist and the API can enforce the same requirements. Standard
 * baseline: 8+ characters with lowercase, uppercase, and a number.
 */

export const PASSWORD_RULES = [
  { key: "length", label: "At least 8 characters", test: (pw: string) => pw.length >= 8 },
  { key: "lower", label: "A lowercase letter", test: (pw: string) => /[a-z]/.test(pw) },
  { key: "upper", label: "An uppercase letter", test: (pw: string) => /[A-Z]/.test(pw) },
  { key: "number", label: "A number", test: (pw: string) => /\d/.test(pw) },
] as const;

/** Human-readable list of unmet requirements; empty when the password passes. */
export function passwordProblems(pw: string): string[] {
  return PASSWORD_RULES.filter((r) => !r.test(pw)).map((r) => r.label);
}

/** 0..4 — how many requirements are met (drives the strength meter). */
export function passwordScore(pw: string): number {
  return PASSWORD_RULES.filter((r) => r.test(pw)).length;
}
