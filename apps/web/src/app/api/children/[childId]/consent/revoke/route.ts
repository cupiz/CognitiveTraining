import { NextRequest } from "next/server";
import { RevokeConsentRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { authorizeChild } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** POST /api/children/[childId]/consent/revoke — revoke consent */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params;
    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = RevokeConsentRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { consentType } = parsed.data;

    // Find the active consent record
    const existing = await prisma.consentRecord.findFirst({
      where: {
        childId,
        consentType,
        revokedAt: null,
      },
    });

    if (!existing) {
      return errorResponse("NOT_FOUND", `No active consent for "${consentType}" found`, 404);
    }

    // Revoke it
    const record = await prisma.consentRecord.update({
      where: { id: existing.id },
      data: { revokedAt: new Date() },
    });

    return dataResponse({
      id: record.id,
      childId: record.childId,
      consentType: record.consentType,
      documentVersion: record.documentVersion,
      grantedAt: record.grantedAt.toISOString(),
      revokedAt: record.revokedAt?.toISOString() ?? null,
      source: record.source,
    });
  } catch (error) {
    console.error("Revoke consent error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
