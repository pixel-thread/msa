import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { UpdateMemberTypeInput } from '../validators';

export function useUpdateMemberType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMemberTypeInput }) =>
      http.patch(`/member-types/${id}`, data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Member type updated successfully');
        queryClient.invalidateQueries({ queryKey: ['member-types-list'] });
        queryClient.invalidateQueries({ queryKey: ['member-types'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to update member type');
    },
  });
}
