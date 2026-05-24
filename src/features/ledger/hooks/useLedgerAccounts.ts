import { useQuery } from "@tanstack/react-query";
import http from "@src/shared/utils/http";
import type { Account } from "@prisma/client";

export function useLedgerAccounts() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["ledger-accounts"],
    queryFn: () => http.get<Account[]>("/ledger/accounts"),
  });

  return {
    accounts: data?.data ?? [],
    meta: data?.meta,
    isLoading,
    error,
    refetch,
  };
}
