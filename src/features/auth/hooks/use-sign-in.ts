import { useMutation } from "@tanstack/react-query";

import http from "@src/shared/utils/http";
import { SignInSchema, type SignInInput } from "@src/features/auth/validators";

export function useSignIn() {
  return useMutation({
    mutationFn: async (data: SignInInput) => {
      const result = SignInSchema.parse(data);
      return http.post<{ mfaRequired?: boolean; tempToken?: string }>(
        "/auth/sign-in",
        result,
      );
    },
  });
}
