import { Expo, ExpoPushMessage, ExpoPushTicket } from 'expo-server-sdk';
import { prisma } from './prisma';

let expo = new Expo();

export class ExpoNotificationService {
  /**
   * Sends push notifications to a list of tokens.
   * Handles chunking and basic error logging.
   */
  static async sendPushNotifications(
    tokens: string[],
    title: string,
    body: string,
    data?: any
  ) {
    const messages: ExpoPushMessage[] = [];
    for (const pushToken of tokens) {
      if (!Expo.isExpoPushToken(pushToken)) {
        console.error(`Push token ${pushToken} is not a valid Expo push token`);
        continue;
      }
      messages.push({
        to: pushToken,
        sound: 'default',
        title,
        body,
        data,
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
              console.log(`Token ${token} is no longer registered. Removing from DB.`);
              await prisma.pushToken.delete({ where: { token } }).catch(e => console.error('Failed to delete token', e));
            }
          }
        }
      } catch (error) {
        console.error('Error sending push notification chunk:', error);
      }
    }
    
    return tickets;
  }
}
