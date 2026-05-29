'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { associationsEndpoints } from '../utils/constants/endpoints';

export function useUploadAssociationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const formData = new FormData();
      formData.append('logo', file);
      return http.post(associationsEndpoints.logo(id), formData);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast.success('Logo uploaded successfully');
        queryClient.invalidateQueries({ queryKey: ['associations'] });
        queryClient.invalidateQueries({ queryKey: ['associations-list'] });
        return;
      }
      toast.error(data.message);
    },
    onError: () => {
      toast.error('Failed to upload logo');
    },
  });
}
