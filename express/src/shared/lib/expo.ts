import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from './prisma';
import { logger } from '@src/shared/logger';
import { NotificationDataT } from '@sharedType/notification';

/** Singleton Expo SDK client for push notification delivery. */
const expo = new Expo();

/**
 * Service for sending Expo push notifications.
 */
export class ExpoNotificationService {
  /**
   * Sends push notifications to a list of Expo push tokens.
   * Validates tokens, chunks requests, and handles error responses
   * including removing invalid tokens from the database.
   *
   * @param tokens - Array of Expo push tokens to send notifications to
   * @param title - Notification title
   * @param body - Notification body text
   * @param data - Optional custom data payload
   * @returns Array of ExpoPushTicket results
   */
  static async sendPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: NotificationDataT,
  ) {
    const messages: ExpoPushMessage[] = [];

    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        logger.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: data as Record<string, any>,
      });
    }

    const chunks = expo.chunkPushNotifications(messages);
    const tickets: ExpoPushTicket[] = [];

    for (const chunk of chunks) {
      try {
        const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
        tickets.push(...ticketChunk);

        // Match tickets with tokens to handle invalid tokens
        for (let i = 0; i < ticketChunk.length; i++) {
          const ticket = ticketChunk[i];
          const token = chunk[i].to;

          if (typeof token === 'string' && ticket.status === 'error') {
            if (ticket.details?.error === 'DeviceNotRegistered') {
              logger.debug(`Token ${token} is no longer registered. Removing from DB.`);
              await prisma.pushToken
                .delete({ where: { token } })
                .catch((e) => logger.error('Failed to delete token', e));
            }
          }
        }
      } catch (error) {
        logger.error({ error }, 'Error sending push notification chunk:');
      }
    }

    return tickets;
  }
}
