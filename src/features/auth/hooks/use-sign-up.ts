import { useMutation } from "@tanstack/react-query";

import http from "@src/shared/utils/http";
import { SignUpSchema, type SignUpInput } from "@src/features/auth/validators";

export function useSignUp() {
  return useMutation({
    mutationFn: async (data: SignUpInput) => {
      const result = SignUpSchema.parse(data);
      return http.post("/auth/sign-up", {
        name: result.name,
        email: result.email,
        password: result.password,
      });
    },
  });
}
