export interface ComplianceCheckResult {
  checkType: string;
  status: string;
  score: number;
  message: string;
  details?: Record<string, unknown>;
  recommendations?: string[];
  checkedAt: Date;
}

export interface ComplianceEvidenceItem {
  type: string;
  description: string;
  count: number;
  sample?: unknown[];
  metadata?: Record<string, unknown>;
}

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
