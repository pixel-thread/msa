import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { CreateAssociationInput } from '../validators';

export function useCreateAssociation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateAssociationInput) => http.post('/associations', data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Association created successfully');
        queryClient.invalidateQueries({ queryKey: ['associations-list'] });
        queryClient.invalidateQueries({ queryKey: ['associations'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to create association');
    },
  });
}
