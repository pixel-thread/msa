import { jest } from '@jest/globals';

export function setupModuleMocks() {
  jest.unstable_mockModule('@upstash/ratelimit', () => ({
    Ratelimit: {
      slidingWindow: jest.fn(),
    },
  }));

  jest.unstable_mockModule('resend', () => ({
    Resend: jest.fn().mockImplementation(() => ({
      emails: {
        send: jest.fn().mockResolvedValue({ data: { id: 'mock-email-id' }, error: null }),
      },
    })),
  }));

  jest.unstable_mockModule('razorpay', () => ({
    default: jest.fn().mockImplementation(() => ({
      orders: { create: jest.fn().mockResolvedValue({ id: 'order_mock', amount: 100, currency: 'INR' }) },
      payments: { fetch: jest.fn().mockResolvedValue({ id: 'pay_mock', status: 'captured' }) },
    })),
  }));
}
