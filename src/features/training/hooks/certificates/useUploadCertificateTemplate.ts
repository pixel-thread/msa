import { useMutation, useQueryClient } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import { toast } from 'sonner';
import { trainingQueryKeys, trainingEndpoints } from '../../utils/constants';

/**
 * Uploads a certificate template file and links it to the training module.
 * Sends FormData with the file to POST /training/modules/[id]/certificate-template.
 */
export function useUploadCertificateTemplate(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (formData: FormData) =>
      http.post(trainingEndpoints.certificates.template(moduleId!), formData),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.detail(moduleId),
        });
        toast.success(res.message || 'Certificate template uploaded');
        return res;
      }
      toast.error(res.message || 'Failed to upload certificate template');
      return res;
    },
  });
}

/**
 * Removes the certificate template from the training module.
 * Sends DELETE to /training/modules/[id]/certificate-template.
 */
export function useRemoveCertificateTemplate(moduleId: string | null) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => http.delete(trainingEndpoints.certificates.template(moduleId!)),
    onSuccess: (res) => {
      if (res.success) {
        queryClient.invalidateQueries({
          queryKey: trainingQueryKeys.modules.detail(moduleId),
        });
        toast.success('Certificate template removed');
        return res;
      }
      toast.error(res.message || 'Failed to remove certificate template');
      return res;
    },
  });
}
