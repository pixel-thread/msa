'use client';
import { useQuery } from '@tanstack/react-query';
import http from '@src/shared/utils/http';
import type { User } from '@src/shared/types';
import { membersEndpoints } from '../utils/constants/endpoints';

export function useMember(memberId: string) {
  const {
    data,
    isLoading: isLo,
    isFetching,
    error,
  } = useQuery({
    queryKey: ['member', memberId],
    queryFn: () => http.get<User>(membersEndpoints.byId(memberId)),
    enabled: !!memberId,
    select: (data) => data.data,
  });

  return {
    member: data,
    isLoading: isFetching || isLo,
    error,
  };
}
