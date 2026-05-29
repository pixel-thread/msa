import { useMutation } from '@tanstack/react-query';

import http from '@src/shared/utils/http';
import { ChangePasswordSchema, type ChangePasswordInput } from '@src/features/auth/validators';
import { authEndpoints } from '../utils/constants/endpoints';

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const result = ChangePasswordSchema.parse(data);
      return http.post(authEndpoints.changePassword, {
        currentPassword: result.currentPassword,
        newPassword: result.newPassword,
      });
    },
  });
}
