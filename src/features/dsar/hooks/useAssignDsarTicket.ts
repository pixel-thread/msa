import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { dsarEndpoints } from '../utils/constants/endpoints';

export function useAssignDsarTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, assignedToId }: { id: string; assignedToId: string }) =>
      http.patch(dsarEndpoints.assign(id), { assignedToId }),
    onSuccess: (response) => {
      if ((response as { success: boolean }).success) {
        toast.success('DSAR ticket assigned successfully');
        queryClient.invalidateQueries({ queryKey: ['dsar-tickets'] });
        queryClient.invalidateQueries({ queryKey: ['dsar-ticket'] });
        return;
      }
      toast.error((response as { message: string }).message);
    },
    onError: () => {
      toast.error('Failed to assign DSAR ticket');
    },
  });
}
