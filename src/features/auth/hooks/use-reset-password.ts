import { useMutation } from "@tanstack/react-query";

import http from "@src/shared/utils/http";
import {
  ResetPasswordSchema,
  type ResetPasswordInput,
} from "@src/features/auth/validators";

export function useResetPassword() {
  return useMutation({
    mutationFn: async (data: ResetPasswordInput) => {
      const result = ResetPasswordSchema.parse(data);
      return http.post("/auth/reset-password", result);
    },
  });
}
