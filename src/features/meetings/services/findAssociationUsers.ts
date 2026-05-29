import 'server-only';
import { prisma } from '@lib/prisma';
import { UserStatus } from '@prisma/client';

interface FindAssociationUsersProps {
  associationId: string;
  search?: string;
  excludeMeetingId?: string;
  pagination: {
    page: number;
    limit: number;
  };
}

export async function findAssociationUsers({
  associationId,
  search,
  excludeMeetingId,
  pagination: { page, limit },
}: FindAssociationUsersProps) {
  const where: any = {
    associationId,
    status: UserStatus.ACTIVE,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { membershipNumber: { contains: search, mode: 'insensitive' } },
    ];
  }

  if (excludeMeetingId) {
    where.NOT = {
      meetingAttendances: {
        some: { meetingId: excludeMeetingId },
      },
    };
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        membershipNumber: true,
        role: true,
      },
      orderBy: { name: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
