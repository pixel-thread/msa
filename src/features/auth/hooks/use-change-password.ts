import { useMutation } from "@tanstack/react-query";

import http from "@src/shared/utils/http";
import {
  ChangePasswordSchema,
  type ChangePasswordInput,
} from "@src/features/auth/validators";

export function useChangePassword() {
  return useMutation({
    mutationFn: async (data: ChangePasswordInput) => {
      const result = ChangePasswordSchema.parse(data);
      return http.post("/auth/change-password", {
        currentPassword: result.currentPassword,
        newPassword: result.newPassword,
      });
    },
  });
}
