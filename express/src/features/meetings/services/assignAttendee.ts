import { prisma } from '@lib/prisma';
import { NotFoundError, ConflictError, ForbiddenError } from '@src/shared/errors';
import { $Enums, AttendeeRole } from '@prisma/client';
import { ExpoNotificationService } from '@lib/expo';
import { logger } from '@src/shared/logger';
import { EXPO_ROUTES } from '@src/shared/constants/expo-route';
import { createNotification } from '@src/shared/services/notification';

/** Props for assigning an attendee to a meeting. */
interface AssignAttendeeProps {
  meetingId: string;
  associationId: string;
  userId: string;
  attendeeRole?: AttendeeRole;
}

/**
 * Assign a user as an attendee to a meeting.
 * Sends a push notification to the assigned user.
 */
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
    throw new NotFoundError('Meeting');
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, associationId },
  });

  if (!user) {
    throw new ForbiddenError('User does not belong to this association');
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
    throw new ConflictError('User is already assigned to this meeting');
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
      const payload = {
        userId: userId,
        type: 'GENERAL_MESSAGE' as $Enums.NotificationType,
        title: meeting.title,
        body: `You have been assigned to: ${meeting.title}`,
        route: EXPO_ROUTES.MEETINGS.MEETING_DETAIL(meeting.id),
        entityId: meetingId,
        createdAt: new Date().toISOString(),
        meta: { id: meeting.id, type: 'MEETING' },
        associationId,
      };

      const notification = await createNotification({
        data: payload,
      });

      const results = await ExpoNotificationService.sendPushNotifications(
        tokens.map((t) => t.token),
        'New Meeting Assigned',
        `You have been assigned to: ${meeting.title}`,
        {
          id: notification.id,
          ...payload,
        },
      );
      logger.debug({ results }, 'Push notification results:');
    }
  } catch (error) {
    logger.error({ error }, 'Failed to send push notification:');
  }

  return attendee;
}
