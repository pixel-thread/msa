import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { announcementEndpoints } from '../utils/constants/endpoints';

export function useUploadAnnouncementImage(announcementId: string) {
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return http.post(announcementEndpoints.upload(announcementId), formData, {
        headers: { 'Content-Type': undefined },
      });
    },
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({ queryKey: ['announcements-list'] });
        queryClient.invalidateQueries({
          queryKey: ['announcement', announcementId],
        });
        toast.success('Image uploaded successfully');
        return res;
      }
      toast.error(res.message || 'Failed to upload image');
      return res;
    },
  });

  return {
    uploadImage: uploadMutation.mutate,
    isUploading: uploadMutation.isPending,
  };
}
