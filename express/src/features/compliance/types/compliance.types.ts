/** Result of a single compliance check execution. */
export interface ComplianceCheckResult {
  checkType: string;
  status: string;
  score: number;
  message: string;
  details?: Record<string, unknown>;
  recommendations?: string[];
  checkedAt: Date;
}

/** A single item of compliance evidence (consent, DSAR, payments, etc.). */
export interface ComplianceEvidenceItem {
  type: string;
  description: string;
  count: number;
  sample?: unknown[];
  metadata?: Record<string, unknown>;
}

/** Full compliance evidence report covering all sections. */
export interface ComplianceEvidence {
  generatedAt: Date;
  associationId: string;
  period: {
    from: Date;
    to: Date;
  };
  sections: {
    consentCoverage: ComplianceEvidenceItem;
    dsarCompliance: ComplianceEvidenceItem;
    memberData: ComplianceEvidenceItem;
    paymentRecords: ComplianceEvidenceItem;
    auditLogs: ComplianceEvidenceItem;
  };
}

/** A stored compliance check record. */
export interface ComplianceRecord {
  id: string;
  checkType: string;
  status: string;
  score: number;
  message: string;
  details?: Record<string, unknown>;
  recommendations?: string[];
  checkedAt: string;
}
