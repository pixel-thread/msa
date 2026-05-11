import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { UserRole } from "@prisma/client";
import {
  GenerateContributionsSchema,
  WaiveContributionSchema,
} from "@feature/payments/validators";
import {
  generateMonthlyContributions,
  markOverdueContributions,
  waiveContribution,
} from "@feature/payments/services/contribution.service";

/**
 * POST /api/payments/contributions
 *
 * Generate monthly contribution period rows for all active members.
 * This can be called manually by an admin or triggered by a cron job.
 *
 * Idempotent — duplicate rows are skipped.
 *
 * Requires: FINANCE role or higher.
 */
export const POST = withAssociation(
  { body: GenerateContributionsSchema },
  async (association, { body }, request) => {
    await withRole(request, UserRole.FINANCE);

    const count = await generateMonthlyContributions(
      association.id,
      body!.year,
      body!.month,
    );

    // Also mark overdue contributions while we're at it
    const overdueCount = await markOverdueContributions(association.id);

    return SuccessResponse(
      {
        data: {
          generated: count,
          markedOverdue: overdueCount,
        },
        message: `Generated ${count} contribution records, marked ${overdueCount} as overdue`,
      },
      201,
    );
  },
);

/**
 * PATCH /api/payments/contributions
 *
 * Waive a contribution period for a member.
 *
 * Requires: FINANCE role or higher.
 */
export const PATCH = withAssociation(
  { body: WaiveContributionSchema },
  async (_association, { body }, request) => {
    await withRole(request, UserRole.FINANCE);

    const waived = await waiveContribution(
      body!.contributionPeriodId,
      body!.reason,
    );

    return SuccessResponse(
      {
        data: waived,
        message: "Contribution period waived successfully",
      },
      200,
    );
  },
);
