import { prisma } from "@lib/prisma";
import { NotFoundError, ForbiddenError } from "@src/shared/errors";
import { AttendeeRole } from "@prisma/client";
import { ExpoNotificationService } from "@lib/expo";

interface BulkAssignAttendeesProps {
  meetingId: string;
  associationId: string;
  userIds: string[];
  attendeeRole?: AttendeeRole;
}

export async function bulkAssignAttendees({
  meetingId,
  associationId,
  userIds,
  attendeeRole = AttendeeRole.OPTIONAL,
}: BulkAssignAttendeesProps) {
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) {
    throw new NotFoundError("Meeting");
  }

  const users = await prisma.user.findMany({
    where: {
      id: { in: userIds },
      associationId,
    },
    select: { id: true },
  });

  const foundUserIds = users.map((u) => u.id);
  const notFoundIds = userIds.filter((id) => !foundUserIds.includes(id));

  if (notFoundIds.length > 0) {
    throw new ForbiddenError(`Users not found in association: ${notFoundIds.join(", ")}`);
  }

  const existingAttendees = await prisma.meetingAttendee.findMany({
    where: {
      meetingId,
      userId: { in: foundUserIds },
    },
    select: { userId: true },
  });

  const existingUserIds = existingAttendees.map((a) => a.userId);
  const newUserIds = foundUserIds.filter((id) => !existingUserIds.includes(id));

  if (newUserIds.length === 0) {
    return { assigned: [], skipped: existingUserIds };
  }

  const assigned = await prisma.meetingAttendee.createManyAndReturn({
    data: newUserIds.map((userId) => ({
      meetingId,
      userId,
      attendeeRole,
    })),
    include: {
      user: {
        select: { id: true, name: true, email: true, membershipNumber: true },
      },
    },
  });

  // Send Push Notifications in background
  try {
    const tokens = await prisma.pushToken.findMany({
      where: { userId: { in: newUserIds } },
      select: { token: true },
    });

    if (tokens.length > 0) {
      // Not awaiting here to avoid blocking bulk assignment response
      ExpoNotificationService.sendPushNotifications(
        tokens.map((t) => t.token),
        "New Meeting Assigned",
        `You have been assigned to: ${meeting.title}`,
        { meetingId: meeting.id }
      ).catch((e) => console.error("Failed to send bulk push notifications:", e));
    }
  } catch (error) {
    console.error("Failed to fetch tokens for push notifications:", error);
  }

  return { assigned, skipped: existingUserIds };
}