"use client";

import { useMutation } from "@tanstack/react-query";
import http from "@src/shared/utils/http";

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler?: (response: {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => void;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  theme?: {
    color?: string;
  };
  modal?: {
    ondismiss?: () => void;
  };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: string, handler: () => void) => void;
    };
  }
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window.Razorpay !== "undefined") {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay checkout script"));
    document.body.appendChild(script);
  });
}

function openCheckout(
  options: RazorpayCheckoutOptions,
): Promise<{
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}> {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (response) => {
        resolve(response);
      },
      modal: {
        ...options.modal,
        ondismiss: () => {
          reject(new Error("Checkout closed by user"));
        },
      },
    });

    rzp.on("payment.failed", () => {
      reject(new Error("Payment failed"));
    });

    rzp.open();
  });
}

export function useTestPayment(providerId: string) {
  return useMutation({
    mutationFn: async () => {
      const orderResponse = await http.post<RazorpayCheckoutOptions>(
        `/payments/providers/${providerId}/test`,
      );

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || "Failed to create test order");
      }

      await loadRazorpayScript();

      const checkoutResponse = await openCheckout(orderResponse.data);

      const verifyResponse = await http.post(
        `/payments/providers/${providerId}/test/verify`,
        {
          razorpayOrderId: checkoutResponse.razorpay_order_id,
          razorpayPaymentId: checkoutResponse.razorpay_payment_id,
          razorpaySignature: checkoutResponse.razorpay_signature,
        },
      );

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || "Payment verification failed");
      }

      return verifyResponse.data;
    },
  });
}
