export class Ratelimit {
  static slidingWindow = () => {};

  limit = async () => ({ success: true, limit: 100, remaining: 99, reset: Date.now() + 60000 });
}
