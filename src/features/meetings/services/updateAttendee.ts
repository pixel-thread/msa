import { prisma } from "@lib/prisma";
import { NotFoundError, ForbiddenError } from "@src/shared/errors";
import { AttendeeRole, RsvpStatus } from "@prisma/client";

interface UpdateAttendeeProps {
  meetingId: string;
  associationId: string;
  userId: string;
  data: {
    attendeeRole?: AttendeeRole;
    rsvpStatus?: RsvpStatus;
    rsvpNote?: string;
  };
  isAdminUpdate?: boolean;
}

export async function updateAttendee({
  meetingId,
  associationId,
  userId,
  data,
  isAdminUpdate = false,
}: UpdateAttendeeProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) {
    throw new NotFoundError("Meeting");
  }

  console.log("Update Attendee", {
    meetingId,
    userId,
  });
  const attendance = await prisma.meetingAttendee.findUnique({
    where: {
      meetingId_userId: {
        meetingId,
        userId,
      },
    },
  });

  if (!attendance) {
    throw new ForbiddenError("User is not assigned to this meeting");
  }

  const updateData: any = {};

  if (isAdminUpdate && data.attendeeRole) {
    updateData.attendeeRole = data.attendeeRole;
  }

  if (data.rsvpStatus) {
    updateData.rsvpStatus = data.rsvpStatus;
    updateData.rsvpAt = new Date();
  }

  if (data.rsvpNote !== undefined) {
    updateData.rsvpNote = data.rsvpNote;
  }

  return await prisma.meetingAttendee.update({
    where: {
      meetingId_userId: {
        meetingId,
        userId,
      },
    },
    data: updateData,
    include: {
      user: {
        select: { id: true, name: true, email: true, membershipNumber: true },
      },
    },
  });
}
