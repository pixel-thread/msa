import { useMutation } from "@tanstack/react-query";

import http from "@src/shared/utils/http";

export function useSignOut() {
  return useMutation({
    mutationFn: async () => {
      return http.post("/auth/logout");
    },
  });
}
