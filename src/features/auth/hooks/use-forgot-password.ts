import { useMutation } from '@tanstack/react-query';

import http from '@src/shared/utils/http';
import { ForgotPasswordSchema, type ForgotPasswordInput } from '@src/features/auth/validators';
import { authEndpoints } from '../utils/constants/endpoints';

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const result = ForgotPasswordSchema.parse(data);
      return http.post(authEndpoints.forgotPassword, result);
    },
  });
}
