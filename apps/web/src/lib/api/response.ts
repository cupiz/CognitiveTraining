import { NextResponse } from "next/server";
import { nanoid } from "nanoid";

/** Create a success response with data envelope */
export function dataResponse<T>(data: T, status = 200) {
  return NextResponse.json(
    { data, requestId: nanoid() },
    { status },
  );
}

/** Create an error response with error envelope */
export function errorResponse(
  code: string,
  message: string,
  status: 400 | 401 | 403 | 404 | 409 | 429 | 500 = 400,
  details: Array<{ field?: string; message: string; code?: string }> = [],
) {
  return NextResponse.json(
    {
      error: { code, message, details },
      requestId: nanoid(),
    },
    { status },
  );
}
