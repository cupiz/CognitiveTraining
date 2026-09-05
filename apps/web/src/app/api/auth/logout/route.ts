import { deleteSession } from "@/lib/auth";
import { dataResponse, errorResponse } from "@/lib/api/response";

export async function POST() {
  try {
    await deleteSession();
    return dataResponse(true);
  } catch (error) {
    console.error("Logout error:", error);
    return errorResponse("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
