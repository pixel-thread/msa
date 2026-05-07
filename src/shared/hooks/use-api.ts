import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import http, { type ApiResponse } from "@src/shared/utils/http";

interface QueryParams {
  queryKey?: unknown[];
  enabled?: boolean;
}

interface MutationParams<TData, TVariables> {
  onSuccess?: (data: TData) => void;
  onError?: (error: Error) => void;
}

export function useGetQuery<TData>(
  url: string,
  { queryKey = [], enabled = true }: QueryParams = {},
) {
  return useQuery<ApiResponse<TData>, Error>({
    queryKey: [url, ...queryKey],
    queryFn: () => http.get<TData>(url),
    enabled,
  });
}

export function usePostMutation<TData, TVariables>(
  url: string,
  { onSuccess, onError }: MutationParams<TData, TVariables> = {},
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: (data) => http.post<TData>(url, data),
    onSuccess: (response) => {
      if (response.success && onSuccess) {
        onSuccess(response.data as TData);
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error);
      }
    },
  });
}

export function usePatchMutation<TData, TVariables>(
  url: string,
  { onSuccess, onError }: MutationParams<TData, TVariables> = {},
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, TVariables>({
    mutationFn: (data) => http.patch<TData>(url, data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [url] });
      if (response.success && onSuccess) {
        onSuccess(response.data as TData);
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error);
      }
    },
  });
}

export function useDeleteMutation<TData>(
  url: string,
  { onSuccess, onError }: MutationParams<TData, void> = {},
) {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<TData>, Error, void>({
    mutationFn: () => http.delete<TData>(url),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [url] });
      if (response.success && onSuccess) {
        onSuccess(response.data as TData);
      }
    },
    onError: (error) => {
      if (onError) {
        onError(error);
      }
    },
  });
}