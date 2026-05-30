import type { RazorpayCheckoutOptions, RazorpayPaymentResponse } from '../types/razorpay-checkout';

export function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
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
