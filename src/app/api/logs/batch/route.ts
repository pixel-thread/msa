import { withValidation } from "@src/shared/api";
import { LogBatchSchema } from "@src/shared/validators/logs";
import { createLogsBatch } from "@src/shared/services/logs";
import { SuccessResponse } from "@src/shared/utils";

export const POST = withValidation(
  { body: LogBatchSchema },
  async (_req, _ctx, { body }) => {
    const { logs } = body!;

    await createLogsBatch({
      data: logs.map((l) => ({
        type: l.level,
        message: l.message,
        content: l.context ?? {},
        isBackend: false,
      })),
    });

    return SuccessResponse(
      { message: "Logs ingested successfully" },
      201,
    );
  },
);
