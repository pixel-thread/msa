import 'server-only';
import { prisma } from '@lib/prisma';
import { NotFoundError, ForbiddenError } from '@src/shared/errors';
import { $Enums, AttendeeRole } from '@prisma/client';
import { ExpoNotificationService } from '@lib/expo';
import { EXPO_ROUTES } from '@src/shared/constants/expo-route';
import { logger } from '@src/shared/logger/server';

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
  // 1. Verify Meeting exists and belongs to the association
  const meeting = await prisma.meeting.findFirst({
    where: { id: meetingId, associationId },
  });

  if (!meeting) {
    throw new NotFoundError('Meeting');
  }

  // 2. Verify all provided userIds exist within this association
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
    throw new ForbiddenError(
      `Access Denied: Users not found in this association: ${notFoundIds.join(', ')}`,
    );
  }

  // 3. Filter out users who are already attendees to avoid unique constraint errors
  const existingAttendees = await prisma.meetingAttendee.findMany({
    where: {
      meetingId,
      userId: { in: foundUserIds },
    },
    select: { userId: true },
  });

  const existingUserIds = existingAttendees.map((a) => a.userId);
  const newUserIds = foundUserIds.filter((id) => !existingUserIds.includes(id));

  // If everyone is already assigned, return early
  if (newUserIds.length === 0) {
    return { assigned: [], skipped: existingUserIds };
  }

  // 4. Bulk assign new attendees
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

  // 5. Handle Notifications (Database Persistence + Push Delivery)
  // We wrap this in a non-awaited block to return the response to the UI faster
  (async () => {
    try {
      // Fetch tokens for newly assigned users
      const userPushTokens = await prisma.pushToken.findMany({
        where: { userId: { in: newUserIds } },
        select: { token: true, userId: true },
      });

      if (newUserIds.length > 0) {
        // A. Create Notification Records in DB (One per User)
        const dbNotifications = newUserIds.map((userId) => ({
          userId,
          type: $Enums.NotificationType.GENERAL_MESSAGE,
          title: meeting.title,
          body: `You have been assigned to: ${meeting.title}`,
          route: EXPO_ROUTES.MEETINGS.MEETING_DETAIL(meeting.id),
          entityId: meetingId,
          meta: { id: meeting.id, type: 'MEETING' },
          associationId,
        }));

        await prisma.notification.createMany({
          data: dbNotifications,
          skipDuplicates: true,
        });

        // B. Send Push Notifications (One per Token)
        if (userPushTokens.length > 0) {
          const allTokens = userPushTokens.map((t) => t.token);

          await ExpoNotificationService.sendPushNotifications(
            allTokens,
            'New Meeting Assigned',
            `You have been assigned to: ${meeting.title}`,
            {
              title: 'New Meeting Assigned',
              body: `You have been assigned to: ${meeting.title}`,
              entityId: meeting.id,
              route: EXPO_ROUTES.MEETINGS.MEETING_DETAIL(meeting.id),
            },
          );
        }
      }
    } catch (error) {
      logger.error(
        {
          meetingId,
          error,
        },
        'Background notification processing failed',
      );
    }
  })();

  return { assigned, skipped: existingUserIds };
}
