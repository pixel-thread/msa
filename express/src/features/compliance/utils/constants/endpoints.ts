/** Compliance API endpoint constants. */
export const complianceEndpoints = {
  checks: '/compliance/checks' as const,
  checkById: (id: string) => `/compliance/checks/${id}`,
  evidence: '/compliance/evidence' as const,
} as const;
