import { NextResponse } from "next/server";
import { DEFAULT_COMPLIANCE } from "@/services/compliance";
import { connectDb } from "@/services/db";
import { CookProfile, PermitDocument } from "@/services/models";
import { isAuthorizedReviewer } from "@/services/review-gate";

export const dynamic = "force-dynamic";

/**
 * PATCH /api/admin/permits/:id — decide a submitted permit document.
 * Body: { action: "approve" | "reject", note?, actorEmail? }.
 *
 * Approve is the ONLY path to the "verified" tier: it stamps the
 * decision, flips the kitchen's permitStatus, and backfills the permit
 * number/agency from the extraction when the cook hasn't typed them.
 * Reject drops the kitchen back to "unverified" with the reviewer's note.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDb();
    const { id } = await params;
    const body = (await req.json()) ?? {};

    if (!isAuthorizedReviewer(body.actorEmail)) {
      return NextResponse.json({ error: "Not authorized to review permits" }, { status: 403 });
    }
    const action = body.action;
    if (action !== "approve" && action !== "reject") {
      return NextResponse.json(
        { error: 'action must be "approve" or "reject"' },
        { status: 400 }
      );
    }
    const note = typeof body.note === "string" ? body.note.trim().slice(0, 300) : "";

    const doc = await PermitDocument.findById(id);
    if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
    if (doc.status !== "submitted") {
      return NextResponse.json(
        { error: `Document was already ${doc.status}` },
        { status: 409 }
      );
    }

    doc.status = action === "approve" ? "approved" : "rejected";
    doc.reviewNote = note;
    doc.decidedAt = new Date();
    await doc.save();

    const cook = await CookProfile.findById(doc.cookId).select("compliance").lean();
    if (cook) {
      const compliance = { ...DEFAULT_COMPLIANCE, ...(cook.compliance ?? {}) };
      if (action === "approve") {
        compliance.permitStatus = "verified";
        // Backfill the public permit posting from the reviewed document
        // when the cook hasn't typed their own details.
        if (!compliance.permitNumber && doc.extracted?.permitNumber) {
          compliance.permitNumber = doc.extracted.permitNumber;
        }
        if (!compliance.permitAgency && doc.extracted?.issuingAgency) {
          compliance.permitAgency = doc.extracted.issuingAgency.slice(0, 80);
        }
      } else {
        compliance.permitStatus = "unverified";
      }
      await CookProfile.findByIdAndUpdate(doc.cookId, { $set: { compliance } });
    }

    return NextResponse.json({ ok: true, status: doc.status });
  } catch (err) {
    console.error("[api/admin/permits/:id PATCH]", err);
    return NextResponse.json({ error: "Failed to record the decision" }, { status: 500 });
  }
}
