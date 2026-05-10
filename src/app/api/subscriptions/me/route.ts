import { requireAuth } from "@src/shared/api/auth";
import { SuccessResponse, ErrorResponse } from "@src/shared/utils/responses";
import { getMySubscription } from "@feature/subscription/services";

export async function GET() {
  const { userId } = await requireAuth();

  const result = await getMySubscription(userId);
  return SuccessResponse({ data: result });
}

