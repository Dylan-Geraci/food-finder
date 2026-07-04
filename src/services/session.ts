import { CookProfile } from "./models";

/**
 * Shapes the session object returned by /api/auth/* — the single source of
 * truth for what the client-side AuthContext knows about the signed-in user.
 */
export interface SessionPayload {
  id: string;
  key: string;
  name: string;
  email: string;
  role: "diner" | "cook";
  addresses: { label: string; line1: string; city: string; isDefault: boolean }[];
  favoriteCookIds: string[];
  cookProfileId: string | null;
  kitchenName: string | null;
  joinedAt: string | null;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function buildSessionPayload(user: any): Promise<SessionPayload> {
  let cookProfileId: string | null = null;
  let kitchenName: string | null = null;
  if (user.role === "cook") {
    const profile = await CookProfile.findOne({ userId: user._id })
      .select("_id kitchenName")
      .lean();
    cookProfileId = profile ? String(profile._id) : null;
    kitchenName = profile?.kitchenName ?? null;
  }
  return {
    id: String(user._id),
    key: user.key,
    name: user.name,
    email: user.email,
    role: user.role,
    addresses: (user.addresses ?? []).map(
      (a: { label: string; line1: string; city: string; isDefault: boolean }) => ({
        label: a.label,
        line1: a.line1,
        city: a.city,
        isDefault: a.isDefault,
      })
    ),
    favoriteCookIds: (user.favoriteCookIds ?? []).map(String),
    cookProfileId,
    kitchenName,
    joinedAt: user.joinedAt ? new Date(user.joinedAt).toISOString() : null,
  };
}
