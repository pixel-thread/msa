import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import type { UpdateAnnouncementInput } from '../validators';
import { announcementEndpoints } from '../utils/constants/endpoints';

export function useUpdateAnnouncement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAnnouncementInput }) =>
      http.put(announcementEndpoints.byId(id), data),
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Announcement updated successfully');
        queryClient.invalidateQueries({ queryKey: ['announcements-list'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to update announcement');
    },
  });
}
