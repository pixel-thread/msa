'use client';

import { useCallback, useMemo } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';

interface UseUrlFiltersOptions {
  basePath?: string;
  pageKey?: string;
  resetPageOnFilter?: boolean;
  mode?: 'replace' | 'push';
}

interface UseUrlFiltersReturn {
  filters: Record<string, string>;
  page: number;
  setPage: (page: number) => void;
  setFilter: (key: string, value: string | undefined) => void;
  setFilters: (filters: Record<string, string | undefined>) => void;
  clearFilter: (key: string) => void;
  resetFilters: () => void;
}

export function useUrlFilters(options: UseUrlFiltersOptions = {}): UseUrlFiltersReturn {
  const { basePath, pageKey = 'page', resetPageOnFilter = true, mode = 'replace' } = options;

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const resolvedPath = basePath ?? pathname;

  const navigate = useCallback(
    (params: URLSearchParams) => {
      const href = `${resolvedPath}?${params.toString()}`;
      router[mode](href, { scroll: false });
    },
    [resolvedPath, router, mode],
  );

  const page = useMemo(() => Number(searchParams.get(pageKey)) || 1, [searchParams, pageKey]);

  const filters = useMemo(() => {
    const result: Record<string, string> = {};
    for (const [key, value] of searchParams.entries()) {
      if (key !== pageKey) result[key] = value;
    }
    return result;
  }, [searchParams, pageKey]);

  const setPage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(pageKey, String(newPage));
      navigate(params);
    },
    [searchParams, navigate, pageKey],
  );

  const setFilter = useCallback(
    (key: string, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (resetPageOnFilter) params.set(pageKey, '1');
      navigate(params);
    },
    [searchParams, navigate, resetPageOnFilter, pageKey],
  );

  const setFilters = useCallback(
    (newFilters: Record<string, string | undefined>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(newFilters)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      if (resetPageOnFilter) params.set(pageKey, '1');
      navigate(params);
    },
    [searchParams, navigate, resetPageOnFilter, pageKey],
  );

  const clearFilter = useCallback(
    (key: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete(key);
      if (resetPageOnFilter) params.set(pageKey, '1');
      navigate(params);
    },
    [searchParams, navigate, resetPageOnFilter, pageKey],
  );

  const resetFilters = useCallback(() => {
    const params = new URLSearchParams();
    params.set(pageKey, '1');
    navigate(params);
  }, [navigate, pageKey]);

  return {
    filters,
    page,
    setPage,
    setFilter,
    setFilters,
    clearFilter,
    resetFilters,
  };
}
