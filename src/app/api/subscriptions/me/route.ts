import { requireAuth } from "@src/shared/api/auth";
import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { getMySubscription } from "@feature/subscription/services";

export async function GET() {
  try {
    const { userId } = await requireAuth();

    const result = await getMySubscription(userId);
    return SuccessResponse({ data: result });
  } catch (error) {
    if (error instanceof Error) {
      return ErrorResponse(error.message, 500);
    }
    return ErrorResponse("Internal server error", 500);
  }
}