import { useMutation } from "@tanstack/react-query";

import http from "@src/shared/utils/http";
import {
  ForgotPasswordSchema,
  type ForgotPasswordInput,
} from "@src/features/auth/validators";

export function useForgotPassword() {
  return useMutation({
    mutationFn: async (data: ForgotPasswordInput) => {
      const result = ForgotPasswordSchema.parse(data);
      return http.post("/auth/forgot-password", result);
    },
  });
}
