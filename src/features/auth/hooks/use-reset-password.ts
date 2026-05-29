import { useMutation } from '@tanstack/react-query';

import http from '@src/shared/utils/http';
import { ResetPasswordSchema, type ResetPasswordInput } from '@src/features/auth/validators';
import { authEndpoints } from '../utils/constants/endpoints';

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const result = ResetPasswordSchema.parse(data);
      return http.post(authEndpoints.resetPassword, result);
    },
  });
}
