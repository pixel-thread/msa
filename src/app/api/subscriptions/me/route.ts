import { auth } from "@clerk/nextjs/server";

import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { getMySubscription } from "@feature/subscription/services";

export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return ErrorResponse("Authentication required", 401);
    }

    const result = await getMySubscription(userId);
    return SuccessResponse(result);
  } catch (error) {
    if (error instanceof Error) {
      return ErrorResponse(error.message, 500);
    }
    return ErrorResponse("Internal server error", 500);
  }
}