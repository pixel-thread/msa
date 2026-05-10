import { prisma } from "@lib/prisma";
import {
  NotFoundError,
  ConflictError,
  ForbiddenError,
} from "@src/shared/errors";
import { AttendeeRole } from "@prisma/client";
import { ExpoNotificationService } from "@lib/expo";
import { logger } from "@src/shared/logger";

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

  const attendee = await prisma.meetingAttendee.create({
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

  // Send Push Notification
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId },
      select: { token: true },
    });

    if (tokens.length > 0) {
      await ExpoNotificationService.sendPushNotifications(
        tokens.map((t) => t.token),
        "New Meeting Assigned",
        `You have been assigned to: ${meeting.title}`,
        { meetingId: meeting.id },
      );
    }
  } catch (error) {
    logger.error("Failed to send push notification:", { error });
  }

  return attendee;
}

