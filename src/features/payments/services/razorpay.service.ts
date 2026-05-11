import Razorpay from "razorpay";
import * as crypto from "crypto";

// ---------------------------------------------------------------------------
// Razorpay SDK singleton
// ---------------------------------------------------------------------------

const getRazorpayInstance = (): Razorpay => {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    throw new Error(
      "RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set in environment variables",
    );
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
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
    currency: params.currency ?? "INR",
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
export function verifyPaymentSignature(
  params: VerifySignatureParams,
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    throw new Error("RAZORPAY_KEY_SECRET is not configured");
  }

  const body = `${params.razorpayOrderId}|${params.razorpayPaymentId}`;

  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

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
): boolean {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  if (!webhookSecret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET is not configured");
  }

  const expectedSignature = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(signature),
    );
  } catch {
    // Lengths differ → signature is invalid
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
export async function initiateRefund(
  razorpayPaymentId: string,
  amountInPaise?: number,
) {
  const razorpay = getRazorpayInstance();
  return razorpay.payments.refund(razorpayPaymentId, {
    amount: amountInPaise, // undefined = full refund
  });
}
