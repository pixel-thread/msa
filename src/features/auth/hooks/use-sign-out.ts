import { useMutation } from '@tanstack/react-query';

import http from '@src/shared/utils/http';
import { authEndpoints } from '../utils/constants/endpoints';

export function useSignOut() {
  return useMutation({
    mutationFn: async () => http.post(authEndpoints.logout, {}),
  });
}
