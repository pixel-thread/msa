import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { User, UserStatus } from '@src/shared/types';
import { membersEndpoints } from '../utils/constants/endpoints';

interface UseMembersOptions {
  page?: number;
  status?: UserStatus;
}

export function useMembers(options: UseMembersOptions = {}) {
  const { page = 1, status = 'ACTIVE' } = options;

  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['members', page, status],
    queryFn: () => http.get<User[]>(membersEndpoints.list(page, status)),
  });

  return {
    members: data?.data ?? [],
    meta: data?.meta,
    isLoading: isFetching || isLoading,
    error,
    refetch,
  };
}
