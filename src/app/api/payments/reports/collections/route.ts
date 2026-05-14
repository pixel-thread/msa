import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@src/shared/utils/responses";
import { UserRole } from "@prisma/client";
import { CollectionReportQuerySchema } from "@feature/payments/validators";
import { prisma } from "@src/shared/lib/prisma";

/**
 * GET /api/payments/reports/collections
 *
 * Flattened data optimized for reporting and export.
 * Mapping payments to members and specific contribution periods.
 *
 * Role: FINANCE+
 */
export const GET = withAssociation(
  { query: CollectionReportQuerySchema },
  async (association, { query }, request) => {
    await withRole(request, UserRole.FINANCE);
    
    const records = await prisma.contributionPeriod.findMany({
      where: {
        associationId: association.id,
        year: query!.year,
        month: query!.month,
        status: query!.status,
      },
      include: {
        user: { 
          select: { 
            name: true, 
            membershipNumber: true 
          } 
        },
        allocations: { 
          include: { 
            paymentTransaction: true 
          } 
        }
      },
      orderBy: { user: { name: "asc" } }
    });

    return SuccessResponse({ data: records });
  },
);
