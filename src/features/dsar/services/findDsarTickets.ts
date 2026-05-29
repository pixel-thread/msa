import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { DsarRequestType, DsarStatus } from '@prisma/client';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils/build-pagination';

interface FindDsarTicketsProps {
  associationId: string;
  userId?: string;
  filters?: {
    status?: DsarStatus;
    requestType?: DsarRequestType;
  };
  pagination?: {
    page: number;
  };
}

/**
 * Retrieves a paginated list of DSAR tickets scoped by association and optional user.
 *
 * Supports filtering by status and request type. Results are ordered by
 * creation date (descending) to show the newest requests first.
 * Includes relations for the requesting member and the assigned administrator.
 *
 * @param {FindDsarTicketsProps} props - Association ID, optional User ID, filters, and pagination.
 * @returns {Promise<{ tickets: DsarTicket[], pagination: object }>} Paginated tickets and metadata.
 */
export async function findDsarTickets({
  associationId,
  userId,
  filters,
  pagination = { page: 1 },
}: FindDsarTicketsProps) {
  const where = {
    associationId,
    ...(userId && { userId }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.requestType && { requestType: filters.requestType }),
  };

  const [tickets, total] = await Promise.all([
    prisma.dsarTicket.findMany({
      where,
      include: {
        member: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (pagination.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.dsarTicket.count({ where }),
  ]);

  return {
    tickets,
    pagination: buildPagination(total, pagination.page),
  };
}
