import { NextRequest } from "next/server";
import { UpdateChildRequest } from "@cog/schemas";
import { prisma } from "@cog/db";
import { authorizeChild } from "@/lib/api/authorize";
import { dataResponse, errorResponse } from "@/lib/api/response";

/** GET /api/children/[childId] — get a single child profile */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params;
    const auth = await authorizeChild(_request, childId);
    if (!auth.ok) return auth.response;

    const child = await prisma.childProfile.findUnique({
      where: { id: childId },
    });

    if (!child) {
      return errorResponse("NOT_FOUND", "Child not found", 404);
    }

    return dataResponse({
      id: child.id,
      accountId: child.accountId,
      displayName: child.displayName,
      birthMonth: child.birthMonth,
      birthYear: child.birthYear,
      locale: child.locale,
      accessibilityJson: child.accessibilityJson,
      status: child.status,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Get child error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** PATCH /api/children/[childId] — update a child profile */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params;
    const auth = await authorizeChild(request, childId);
    if (!auth.ok) return auth.response;

    const body = await request.json();
    const parsed = UpdateChildRequest.safeParse(body);

    if (!parsed.success) {
      return errorResponse("VALIDATION_ERROR", "Invalid request", 400,
        parsed.error.issues.map((i) => ({ field: i.path.join("."), message: i.message })),
      );
    }

    const data = parsed.data;

    // Build update data (only include defined fields)
    const updateData: Record<string, unknown> = {};
    if (data.displayName !== undefined) updateData.displayName = data.displayName;
    if (data.birthYear !== undefined) updateData.birthYear = data.birthYear;
    if (data.birthMonth !== undefined) updateData.birthMonth = data.birthMonth;
    if (data.locale !== undefined) updateData.locale = data.locale;
    if (data.accessibilityJson !== undefined) updateData.accessibilityJson = data.accessibilityJson;
    if (data.status !== undefined) updateData.status = data.status;

    if (Object.keys(updateData).length === 0) {
      return errorResponse("VALIDATION_ERROR", "No fields to update", 400);
    }

    const child = await prisma.childProfile.update({
      where: { id: childId },
      data: updateData,
    });

    return dataResponse({
      id: child.id,
      accountId: child.accountId,
      displayName: child.displayName,
      birthMonth: child.birthMonth,
      birthYear: child.birthYear,
      locale: child.locale,
      accessibilityJson: child.accessibilityJson,
      status: child.status,
      createdAt: child.createdAt.toISOString(),
      updatedAt: child.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error("Update child error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}

/** DELETE /api/children/[childId] — soft-delete a child profile */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ childId: string }> },
) {
  try {
    const { childId } = await params;
    const auth = await authorizeChild(_request, childId);
    if (!auth.ok) return auth.response;

    // Soft delete: set status to deleted
    await prisma.childProfile.update({
      where: { id: childId },
      data: { status: "deleted" },
    });

    return dataResponse(true);
  } catch (error) {
    console.error("Delete child error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
