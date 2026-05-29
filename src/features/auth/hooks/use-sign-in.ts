import { useMutation } from '@tanstack/react-query';

import http from '@src/shared/utils/http';
import { SignInSchema, type SignInInput } from '@src/features/auth/validators';
import { useAuthStore } from '@src/shared/stores';
import { authEndpoints } from '../utils/constants/endpoints';

export function useSignIn() {
  const { fetchUser } = useAuthStore();
  return useMutation({
    mutationFn: async (data: SignInInput) => {
      const result = SignInSchema.parse(data);
      return http.post<{ mfaRequired?: boolean; tempToken?: string }>(authEndpoints.signIn, result);
    },
    onSuccess: (data) => {
      if (data.success) {
        fetchUser();
      }
    },
  });
}
