import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { announcementEndpoints } from '../utils/constants/endpoints';

export function useDeleteAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(announcementEndpoints.byId(id)),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Announcement deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['announcements-list'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to delete announcement');
    },
  });
}
