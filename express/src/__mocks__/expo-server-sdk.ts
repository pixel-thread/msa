export class Expo {
  static isExpoPushToken() {
    return true;
  }

  chunkPushNotifications(messages: unknown[]) {
    return [messages];
  }

  async sendPushNotificationsAsync() {
    return [{ status: 'ok', id: 'mock-ticket-id' }];
  }
}
