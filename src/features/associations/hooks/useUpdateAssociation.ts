import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { UpdateAssociationInput } from '../validators';
import { associationsEndpoints } from '../utils/constants/endpoints';

export function useUpdateAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAssociationInput }) =>
      http.patch(associationsEndpoints.byId(id), data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Association updated successfully');
        queryClient.invalidateQueries({ queryKey: ['associations-list'] });
        queryClient.invalidateQueries({ queryKey: ['associations'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to update association');
    },
  });
}
