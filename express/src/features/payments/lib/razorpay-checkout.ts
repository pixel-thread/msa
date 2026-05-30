// ---------------------------------------------------------------------------
// Razorpay Checkout Script — client-side helpers for loading and opening
// the Razorpay payment checkout widget.
// ---------------------------------------------------------------------------

import type { RazorpayCheckoutOptions, RazorpayPaymentResponse } from '../types/razorpay-checkout';

/**
 * Dynamically load the Razorpay checkout.js script from the CDN.
 *
 * Resolves once the script is loaded and `window.Razorpay` is available.
 * Rejects if the script fails to load (network error, CDN down, etc.).
 */
export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    // Already loaded — skip re-inserting the script tag
    if (typeof window.Razorpay !== 'undefined') {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Razorpay checkout script'));
    document.body.appendChild(script);
  });
}

/**
 * Open the Razorpay checkout modal with the given options.
 *
 * Resolves with the payment response on success.
 * Rejects if the user closes the modal or the payment fails.
 */
export function openRazorpayCheckout(
  options: RazorpayCheckoutOptions,
): Promise<RazorpayPaymentResponse> {
  return new Promise((resolve, reject) => {
    const rzp = new window.Razorpay({
      ...options,
      handler: (response) => {
        resolve(response);
      },
      modal: {
        ...options.modal,
        ondismiss: () => {
          // User closed the checkout modal without completing payment
          reject(new Error('Checkout closed by user'));
        },
      },
    });

    rzp.on('payment.failed', () => {
      reject(new Error('Payment failed'));
    });

    rzp.open();
  });
}
