import { NextResponse } from "next/server";
import { DEFAULT_COMPLIANCE } from "@/services/compliance";
import { connectDb } from "@/services/db";
import { CookProfile, PermitDocument, User } from "@/services/models";
import { isAuthorizedReviewer } from "@/services/review-gate";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/permits?actorEmail=... — the permit review queue:
 * submitted documents joined with kitchen identity and the compliance
 * details the cook typed, so the reviewer can compare against the
 * extracted fields. Gated by HOMEPLATE_ADMIN_EMAILS when set.
 */
export async function GET(req: Request) {
  try {
    await connectDb();
    const url = new URL(req.url);
    if (!isAuthorizedReviewer(url.searchParams.get("actorEmail"))) {
      return NextResponse.json({ error: "Not authorized to review permits" }, { status: 403 });
    }

    const docs = await PermitDocument.find({ status: "submitted" })
      .sort({ submittedAt: 1 }) // oldest first — review in arrival order
      .lean();

    const cooks = await CookProfile.find({ _id: { $in: docs.map((d) => d.cookId) } })
      .select("kitchenName userId compliance location")
      .lean();
    const users = await User.find({ _id: { $in: cooks.map((c) => c.userId) } })
      .select("name email")
      .lean();
    const cookById = new Map(cooks.map((c) => [String(c._id), c]));
    const userById = new Map(users.map((u) => [String(u._id), u]));

    return NextResponse.json({
      queue: docs.map((d) => {
        const cook = cookById.get(String(d.cookId));
        const user = cook ? userById.get(String(cook.userId)) : null;
        return {
          id: String(d._id),
          image: d.image,
          extracted: d.extracted ?? null,
          submittedAt: d.submittedAt,
          cookId: String(d.cookId),
          kitchenName: cook?.kitchenName ?? "Unknown kitchen",
          cookName: user?.name ?? "Unknown cook",
          locationLabel: cook?.location?.label ?? "",
          compliance: { ...DEFAULT_COMPLIANCE, ...(cook?.compliance ?? {}) },
        };
      }),
    });
  } catch (err) {
    console.error("[api/admin/permits]", err);
    return NextResponse.json({ error: "Failed to load review queue" }, { status: 500 });
  }
}
