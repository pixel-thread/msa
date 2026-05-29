import { useMutation } from '@tanstack/react-query';

import http from '@src/shared/utils/http';
import { type MembershipApplicationInput } from '@src/features/membership-applications/validators';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { authEndpoints } from '../utils/constants/endpoints';

export function useSignUp() {
  const router = useRouter();
  return useMutation({
    mutationFn: async (data: MembershipApplicationInput) => http.post(authEndpoints.signUp, data),
    onSuccess: (data) => {
      if (data.success) {
        router.push('/sign-in');
        toast.success(data.message);
        return;
      }
      toast.error(data.message);
    },
  });
}
