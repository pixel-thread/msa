export class Resend {
  emails = {
    send: async () => ({ data: { id: 'mock-email-id' }, error: null }),
  };

  constructor(_apiKey?: string) {}
}
