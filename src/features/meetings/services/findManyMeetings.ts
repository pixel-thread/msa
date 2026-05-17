import { prisma } from "@lib/prisma";
import { MeetingType, MeetingStatus, Prisma, UserRole } from "@prisma/client";
import { buildPagination } from "@src/shared/utils/build-pagination";
import { hasHighRoleAccess } from "@src/shared/utils/hasHighRole";

interface FindManyMeetingsProps {
  associationId: string;
  userId?: string;
  role: UserRole[];
  filters?: {
    type?: MeetingType;
    status?: MeetingStatus;
  };
  pagination: {
    page: number;
    limit: number;
  };
}

export async function findManyMeetings({
  associationId,
  filters,
  pagination: { page, limit },
  userId,
  role,
}: FindManyMeetingsProps) {
  const isHighRole = hasHighRoleAccess(role);

  let where: Prisma.MeetingWhereInput = {
    associationId,
    ...(filters?.type && { type: filters.type }),
    ...(filters?.status && { status: filters.status }),
  };

  if (!isHighRole) {
    where = {
      ...where,
      attendees: { some: { userId: userId } },
    };
  }

  const [meetings, total] = await Promise.all([
    prisma.meeting.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true },
        },
        _count: {
          select: { attendees: true },
        },
      },
      orderBy: { scheduledAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.meeting.count({ where }),
  ]);

  return {
    meetings,
    pagination: buildPagination(total, page, limit),
  };
}
