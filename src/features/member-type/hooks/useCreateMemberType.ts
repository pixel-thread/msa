import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { CreateMemberTypeInput } from '../validators';
import { memberTypeEndpoints } from '../utils/constants/endpoints';

export function useCreateMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMemberTypeInput) => http.post(memberTypeEndpoints.base, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Member type created successfully');
        queryClient.invalidateQueries({ queryKey: ['member-types-list'] });
        queryClient.invalidateQueries({ queryKey: ['member-types'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to create member type');
    },
  });
}
