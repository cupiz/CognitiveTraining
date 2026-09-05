import { NextRequest, NextResponse } from "next/server";
import { GrantConsentRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { authorizeChild } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** POST /api/children/[childId]/consent — grant consent */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params;
    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = GrantConsentRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const { consentType, documentVersion } = parsed.data;

    // Check if there's already an active (non-revoked) consent of this type
    const existing = await prisma.consentRecord.findFirst({
      where: {
        childId,
        consentType,
        revokedAt: null,
      },
    });

    if (existing) {
      return errorResponse("CONFLICT", `Consent for "${consentType}" is already granted`, 409);
    }

    const record = await prisma.consentRecord.create({
      data: {
        childId,
        consentType,
        documentVersion,
        source: "parent_portal",
      },
    });

    return dataResponse(
      {
        id: record.id,
        childId: record.childId,
        consentType: record.consentType,
        documentVersion: record.documentVersion,
        grantedAt: record.grantedAt.toISOString(),
        revokedAt: record.revokedAt?.toISOString() ?? null,
        source: record.source,
      },
      201,
    );
  } catch (error) {
    console.error("Grant consent error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** GET /api/children/[childId]/consent — list consent records */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params;
    const auth = await authorizeChild(_request, childId);
    if (!auth.ok) return auth.response;

    const records = await prisma.consentRecord.findMany({
      where: { childId },
      orderBy: { grantedAt: "desc" },
    });

    return NextResponse.json({
      data: records.map((r) => ({
        id: r.id,
        childId: r.childId,
        consentType: r.consentType,
        documentVersion: r.documentVersion,
        grantedAt: r.grantedAt.toISOString(),
        revokedAt: r.revokedAt?.toISOString() ?? null,
        source: r.source,
      })),
      total: records.length,
      cursor: null,
      requestId: crypto.randomUUID(),
    });
  } catch (error) {
    console.error("List consent error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
