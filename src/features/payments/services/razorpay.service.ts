import Razorpay from 'razorpay';
import * as crypto from 'crypto';
import { NotFoundError } from '@src/shared/errors';
import { env } from '@src/env';

// ---------------------------------------------------------------------------
// Razorpay SDK factory (replaces singleton for multi-tenant support)
// ---------------------------------------------------------------------------

export const createRazorpayClient = (keyId: string, keySecret: string): Razorpay => {
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

const getRazorpayInstance = (): Razorpay => {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables');
  }

  return createRazorpayClient(keyId, keySecret);
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CreateOrderParams {
  /** Amount in smallest currency unit (paise for INR). */
  amountInPaise: number;
  currency?: string;
  /** A unique receipt ID from our system (typically paymentTransaction.id). */
  receipt: string;
  notes?: Record<string, string>;
}

export interface RazorpayOrderResponse {
  id: string;
  entity: string;
  amount: number;
  amount_paid: number;
  amount_due: number;
  currency: string;
  receipt: string;
  status: string;
  created_at: number;
}

export interface VerifySignatureParams {
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// ---------------------------------------------------------------------------
// Service functions
// ---------------------------------------------------------------------------

/**
 * Create a Razorpay order.
 *
 * The frontend uses the returned order ID to open the Razorpay checkout.
 */
export async function createRazorpayOrder(
  params: CreateOrderParams,
): Promise<RazorpayOrderResponse> {
  const razorpay = getRazorpayInstance();

  const order = await razorpay.orders.create({
    amount: params.amountInPaise,
    currency: params.currency ?? 'INR',
    receipt: params.receipt,
    notes: params.notes ?? {},
  });

  return order as unknown as RazorpayOrderResponse;
}

/**
 * Verify the Razorpay payment signature using HMAC SHA-256.
 *
 * This MUST be called on the server before trusting any callback from the
 * client-side Razorpay checkout.
 */
export function verifyPaymentSignature(params: VerifySignatureParams, keySecret?: string): boolean {
  const secret = keySecret ?? env.RAZORPAY_KEY_SECRET;

  if (!secret) {
    throw new Error('RAZORPAY_KEY_SECRET is not configured');
  }

  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;

  const expectedSignature = crypto.createHmac('sha256', secret).update(body).digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(params.razorpaySignature),
  );
}

/**
 * Verify the signature on an incoming Razorpay webhook payload.
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  webhookSecret?: string,
): boolean {
  const secret = webhookSecret ?? env.RAZORPAY_WEBHOOK_SECRET;

  if (!secret) {
    throw new Error('RAZORPAY_WEBHOOK_SECRET is not configured');
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature));
  } catch {
    return false;
  }
}

/**
 * Fetch full payment details from Razorpay by payment ID.
 */
export async function fetchPaymentDetails(razorpayPaymentId: string) {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.fetch(razorpayPaymentId);
}

/**
 * Issue a full or partial refund on a Razorpay payment.
 */
export async function initiateRefund(razorpayPaymentId: string, amountInPaise?: number) {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.refund(razorpayPaymentId, {
    amount: amountInPaise,
  });
}

export async function getRazorpayClientForAssociation(associationId: string) {
  const { getActiveProvider } = await import('./payment-provider.service');
  const { decrypt } = await import('@src/shared/lib/crypto');

  const provider = await getActiveProvider(associationId, 'RAZORPAY');
  if (!provider) {
    throw new NotFoundError('No payment provider configured for association');
  }

  const keySecret = decrypt(provider.encryptedKeySecret);
  return createRazorpayClient(provider.keyId, keySecret);
}
