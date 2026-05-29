'use client';

import { Button } from '@src/shared/components/ui/button';
import { useTestPayment } from '../hooks/useRazorpayCheckout';
import { toast } from 'sonner';

interface TestPaymentButtonProps {
  providerId: string;
  providerType: string;
}

export function TestPaymentButton({ providerId, providerType }: TestPaymentButtonProps) {
  const testPayment = useTestPayment(providerId);

  if (providerType !== 'RAZORPAY') return null;

  const handleTest = () => {
    testPayment.mutate(undefined, {
      onSuccess: () => {
        toast.success('Test payment completed successfully!');
      },
      onError: (error) => {
        const message =
          error instanceof Error ? error.message : 'Test payment failed. Please try again.';
        toast.error(message);
      },
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleTest} disabled={testPayment.isPending}>
      {testPayment.isPending ? 'Testing...' : 'Test'}
    </Button>
  );
}
