// ---------------------------------------------------------------------------
// Ledger endpoint path constants
// ---------------------------------------------------------------------------

/** Endpoint path constants for the ledger feature. */
export const ledgerEndpoints = {
  accounts: '/ledger/accounts' as const,
  summary: '/ledger/summary' as const,
  entries: '/ledger/entries' as const,
  approveEntry: (id: string) => `/ledger/entries/${id}/approve`,
} as const;
