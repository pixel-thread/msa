import { useMutation } from "@tanstack/react-query";

import http from "@src/shared/utils/http";
import {
  VerifySignInSchema,
  type VerifySignInInput,
} from "@src/features/auth/validators";

export function useVerifyMfa() {
  return useMutation({
    mutationFn: async (data: VerifySignInInput) => {
      const result = VerifySignInSchema.parse(data);
      return http.post("/auth/sign-in/verify", result);
    },
  });
}
