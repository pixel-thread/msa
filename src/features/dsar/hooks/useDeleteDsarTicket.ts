import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';

export function useDeleteDsarTicket() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(`/dsar/${id}`),
    onSuccess: (response) => {
      if ((response as { success: boolean }).success) {
        toast.success('DSAR ticket deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['dsar-tickets'] });
        queryClient.invalidateQueries({ queryKey: ['dsar-sla'] });
        return;
      }
      toast.error((response as { message: string }).message);
    },
    onError: () => {
      toast.error('Failed to delete DSAR ticket');
    },
  });
}
