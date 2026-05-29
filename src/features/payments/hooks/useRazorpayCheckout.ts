'use client';

import { useMutation } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { RazorpayCheckoutOptions } from '../types/razorpay-checkout';
import { loadRazorpayScript, openRazorpayCheckout } from '../lib/razorpay-checkout';
import { paymentEndpoints } from '../utils/constants/endpoints';

export function useTestPayment(providerId: string) {
  return useMutation({
    mutationFn: async () => {
      const orderResponse = await http.post<RazorpayCheckoutOptions>(
        paymentEndpoints.testVerify(providerId).replace('/verify', ''),
      );

      if (!orderResponse.success || !orderResponse.data) {
        throw new Error(orderResponse.message || 'Failed to create test order');
      }

      await loadRazorpayScript();

      const checkoutResponse = await openRazorpayCheckout(orderResponse.data);

      const verifyResponse = await http.post(paymentEndpoints.testVerify(providerId), {
        razorpayOrderId: checkoutResponse.razorpay_order_id,
        razorpayPaymentId: checkoutResponse.razorpay_payment_id,
        razorpaySignature: checkoutResponse.razorpay_signature,
      });

      if (!verifyResponse.success) {
        throw new Error(verifyResponse.message || 'Payment verification failed');
      }

      return verifyResponse.data;
    },
  });
}
