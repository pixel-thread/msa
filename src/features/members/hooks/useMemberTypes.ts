import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';

interface MemberType {
  id: string;
  level: number;
  description: string | null;
}

export function useMemberTypes() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['member-types'],
    queryFn: async () => http.get<MemberType[]>('/member-types'),
    select: (data) => data.data,
  });

  return {
    memberTypes: data ?? [],
    isLoading,
    error,
  };
}
