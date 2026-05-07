import { prisma } from "@lib/prisma";
import { NotFoundError, ConflictError, ForbiddenError } from "@src/shared/errors";
import { AttendeeRole } from "@prisma/client";

interface AssignAttendeeProps {
  meetingId: string;
  associationId: string;
  userId: string;
  attendeeRole?: AttendeeRole;
}

export async function assignAttendee({
  meetingId,
  associationId,
  userId,
  attendeeRole = AttendeeRole.OPTIONAL,
}: AssignAttendeeProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) {
    throw new NotFoundError("Meeting");
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, associationId },
  });

  if (!user) {
    throw new ForbiddenError("User does not belong to this association");
  }

  const existingAttendance = await prisma.meetingAttendee.findUnique({
    where: {
      meetingId_userId: {
        meetingId,
        userId,
      },
    },
  });

  if (existingAttendance) {
    throw new ConflictError("User is already assigned to this meeting");
  }

  return await prisma.meetingAttendee.create({
    data: {
      meetingId,
      userId,
      attendeeRole,
    },
    include: {
      user: {
        select: { id: true, name: true, email: true, membershipNumber: true },
      },
    },
  });
}