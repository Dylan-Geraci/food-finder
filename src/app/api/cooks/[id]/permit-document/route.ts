import { NextResponse } from "next/server";
import { DEFAULT_COMPLIANCE } from "@/services/compliance";
import { connectDb } from "@/services/db";
import { isMediaString } from "@/services/media";
import { CookProfile, PermitDocument } from "@/services/models";

export const dynamic = "force-dynamic";

function serialize(doc: {
  _id: unknown;
  image: string;
  status: string;
  extracted?: {
    isPermitDocument: boolean;
    permitNumber: string;
    issuingAgency: string;
    holderName: string;
    expirationDate: string;
    confidence: string;
  } | null;
  reviewNote: string;
  submittedAt: Date;
  decidedAt?: Date | null;
}) {
  return {
    id: String(doc._id),
    image: doc.image,
    status: doc.status,
    extracted: doc.extracted ?? null,
    reviewNote: doc.reviewNote ?? "",
    submittedAt: doc.submittedAt,
    decidedAt: doc.decidedAt ?? null,
  };
}

/**
 * POST /api/cooks/:id/permit-document — submit a permit photo for review.
 * Body: { image } (compressed data URL from MediaUpload, or http(s) URL).
 * Replaces any still-undecided submission and moves the kitchen's permit
 * tier to "pending". Documents are verified by a human in the
 * /admin/permits queue; the `extracted` field stays null — it's the seam
 * where an automated pre-fill step could slot in later without touching
 * the review flow.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
    const body = (await req.json()) ?? {};
    const image = body.image;

    if (!isMediaString(image) || image === "") {
      return NextResponse.json(
        { error: "A permit photo (compressed image upload) is required" },
        { status: 400 }
      );
    }

    const cook = await CookProfile.findById(id).select("compliance").lean();
    if (!cook) return NextResponse.json({ error: "Kitchen not found" }, { status: 404 });

    // A new upload supersedes any submission still awaiting review;
    // decided documents stay as the audit trail.
    await PermitDocument.deleteMany({ cookId: id, status: "submitted" });

    const doc = await PermitDocument.create({
      cookId: id,
      image,
      status: "submitted",
      submittedAt: new Date(),
    });

    // A document in review always puts the kitchen in the "pending" tier
    // (never upgrades to verified — that's the reviewer's call alone).
    const compliance = { ...DEFAULT_COMPLIANCE, ...(cook.compliance ?? {}) };
    if (compliance.permitStatus !== "verified") {
      compliance.permitStatus = "pending";
      await CookProfile.findByIdAndUpdate(id, { $set: { compliance } });
    }

    return NextResponse.json(
      { ok: true, document: serialize(doc.toObject()) },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/cooks/:id/permit-document POST]", err);
    return NextResponse.json({ error: "Failed to submit permit document" }, { status: 500 });
  }
}

/** GET /api/cooks/:id/permit-document — recent submissions, newest first. */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
    const docs = await PermitDocument.find({ cookId: id })
      .sort({ submittedAt: -1 })
      .limit(3)
      .lean();
    return NextResponse.json({ documents: docs.map(serialize) });
  } catch (err) {
    console.error("[api/cooks/:id/permit-document GET]", err);
    return NextResponse.json({ error: "Failed to load permit documents" }, { status: 500 });
  }
}
