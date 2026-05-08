import { prisma } from "@lib/prisma";
import { MeetingType, MeetingStatus } from "@prisma/client";

interface FindManyMeetingsProps {
  associationId: string;
  userId?: string;
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
}: FindManyMeetingsProps) {
  const where = {
    associationId,
    ...(filters?.type && { type: filters.type }),
    ...(filters?.status && { status: filters.status }),
  };

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
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
