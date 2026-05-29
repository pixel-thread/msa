import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import {
  ConsentStatus,
  ConsentPurpose,
  DsarStatus,
  UserStatus,
  PaymentStatus,
  ComplianceCheckStatus,
} from '@prisma/client';
import type { ComplianceCheckResult, ComplianceEvidence } from '../types';

export async function runComplianceCheck(
  associationId: string,
  checkType: string,
): Promise<ComplianceCheckResult> {
  const checkers: Record<string, () => Promise<ComplianceCheckResult>> = {
    CONSENT_COVERAGE: () => checkConsentCoverage(associationId),
    DSAR_SLA_COMPLIANCE: () => checkDsarSlaCompliance(associationId),
    DATA_RETENTION: () => checkDataRetention(associationId),
    PII_ENCRYPTION: () => checkPiiEncryption(associationId),
    SUBSCRIPTION_EXPIRY: () => checkSubscriptionExpiry(associationId),
    MEMBER_DATA_COMPLETENESS: () => checkMemberDataCompleteness(associationId),
    PAYMENT_RECONCILIATION: () => checkPaymentReconciliation(associationId),
    AUDIT_LOG_INTEGRITY: () => checkAuditLogIntegrity(associationId),
  };

  const checker = checkers[checkType];
  if (!checker) {
    return {
      checkType,
      status: 'SKIPPED',
      score: 0,
      message: `Unknown check type: ${checkType}`,
      checkedAt: new Date(),
    };
  }

  return checker();
}

async function checkConsentCoverage(associationId: string): Promise<ComplianceCheckResult> {
  const purposes = [
    ConsentPurpose.PAYMENTS,
    ConsentPurpose.COMMUNICATIONS,
    ConsentPurpose.MEETINGS,
    ConsentPurpose.ANALYTICS,
    ConsentPurpose.MARKETING,
  ];

  const totalMembers = await prisma.user.count({
    where: { associationId, status: UserStatus.ACTIVE },
  });

  if (totalMembers === 0) {
    return {
      checkType: 'CONSENT_COVERAGE',
      status: 'WARNING',
      score: 100,
      message: 'No active members to check',
      details: { totalMembers: 0 },
      checkedAt: new Date(),
    };
  }

  const coverageByPurpose = await Promise.all(
    purposes.map(async (purpose) => {
      const granted = await prisma.consentReceipt.count({
        where: {
          associationId,
          purpose,
          status: ConsentStatus.GRANTED,
        },
      });
      return {
        purpose,
        granted,
        coverage: totalMembers > 0 ? (granted / totalMembers) * 100 : 0,
      };
    }),
  );

  const avgCoverage = coverageByPurpose.reduce((sum, p) => sum + p.coverage, 0) / purposes.length;

  let status: ComplianceCheckStatus = 'PASSED';
  if (avgCoverage < 50) status = 'FAILED';
  else if (avgCoverage < 80) status = 'WARNING';

  return {
    checkType: 'CONSENT_COVERAGE',
    status,
    score: Math.round(avgCoverage),
    message: `Average consent coverage: ${avgCoverage.toFixed(1)}%`,
    details: { totalMembers, coverageByPurpose },
    recommendations:
      status !== 'PASSED'
        ? [
            'Send reminder communications to members about consent requirements',
            'Review consent collection process during onboarding',
          ]
        : [],
    checkedAt: new Date(),
  };
}

async function checkDsarSlaCompliance(associationId: string): Promise<ComplianceCheckResult> {
  const now = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(now.getDate() + 3);

  const [total, breached, atRisk, completed, rejected] = await Promise.all([
    prisma.dsarTicket.count({
      where: {
        associationId,
        status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
      },
    }),
    prisma.dsarTicket.count({
      where: {
        associationId,
        status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
        responseDeadline: { lt: now },
      },
    }),
    prisma.dsarTicket.count({
      where: {
        associationId,
        status: { notIn: [DsarStatus.COMPLETED, DsarStatus.REJECTED] },
        responseDeadline: { gte: now, lte: threeDaysFromNow },
      },
    }),
    prisma.dsarTicket.count({
      where: { associationId, status: DsarStatus.COMPLETED },
    }),
    prisma.dsarTicket.count({
      where: { associationId, status: DsarStatus.REJECTED },
    }),
  ]);

  const complianceScore = total > 0 ? ((total - breached) / total) * 100 : 100;

  let status: ComplianceCheckStatus = 'PASSED';
  if (breached > 0) status = 'FAILED';
  else if (atRisk > 0) status = 'WARNING';

  return {
    checkType: 'DSAR_SLA_COMPLIANCE',
    status,
    score: Math.round(complianceScore),
    message:
      breached > 0 ? `${breached} breached, ${atRisk} at risk` : 'All DSAR tickets within SLA',
    details: { total, breached, atRisk, completed, rejected },
    recommendations:
      breached > 0 || atRisk > 0
        ? [
            'Prioritize DSAR tickets approaching deadline',
            'Review DSAR response process for bottlenecks',
          ]
        : [],
    checkedAt: new Date(),
  };
}

async function checkDataRetention(associationId: string): Promise<ComplianceCheckResult> {
  const now = new Date();
  const sevenYearsAgo = new Date();
  sevenYearsAgo.setFullYear(now.getFullYear() - 7);

  const [anonymizedCount, expiredActive, total] = await Promise.all([
    prisma.user.count({
      where: {
        associationId,
        status: UserStatus.ANONYMIZED,
      },
    }),
    prisma.user.count({
      where: {
        associationId,
        status: UserStatus.ACTIVE,
        dataRetentionUntil: { lt: now },
      },
    }),
    prisma.user.count({
      where: { associationId },
    }),
  ]);

  const score = total > 0 ? ((total - expiredActive) / total) * 100 : 100;

  let status: ComplianceCheckStatus = 'PASSED';
  if (expiredActive > 0) status = 'WARNING';

  return {
    checkType: 'DATA_RETENTION',
    status,
    score: Math.round(score),
    message:
      expiredActive > 0
        ? `${expiredActive} users past retention date`
        : 'All user data within retention period',
    details: { total, anonymizedCount, expiredActive },
    recommendations:
      expiredActive > 0
        ? ['Run anonymization cron job', 'Review data retention policy enforcement']
        : [],
    checkedAt: new Date(),
  };
}

async function checkPiiEncryption(associationId: string): Promise<ComplianceCheckResult> {
  const sampleUsers = await prisma.user.findMany({
    where: { associationId },
    select: {
      id: true,
      name: true,
      email: true,
      mobile: true,
      designation: true,
    },
    take: 10,
    orderBy: { createdAt: 'desc' },
  });

  const issues: string[] = [];

  for (const user of sampleUsers) {
    if (user.mobile && user.mobile.length < 10) {
      issues.push(`User ${user.id}: mobile appears not encrypted`);
    }
    if (user.designation && user.designation.length < 2) {
      issues.push(`User ${user.id}: designation appears not encrypted`);
    }
  }

  const totalMembers = await prisma.user.count({
    where: { associationId },
  });

  let status: ComplianceCheckStatus = 'PASSED';
  let score = 100;
  let message = 'PII fields appear to be encrypted';

  if (issues.length > 0) {
    status = 'WARNING';
    score = 80;
    message = 'Potential unencrypted PII detected';
  }

  if (totalMembers === 0) {
    status = 'SKIPPED';
    score = 100;
    message = 'No members to check';
  }

  return {
    checkType: 'PII_ENCRYPTION',
    status,
    score,
    message,
    details: { totalMembers, checkedSamples: sampleUsers.length, issues },
    recommendations:
      issues.length > 0
        ? ['Verify encryption middleware is active', 'Check FIELD_ENCRYPTION_KEY configuration']
        : [],
    checkedAt: new Date(),
  };
}

async function checkSubscriptionExpiry(associationId: string): Promise<ComplianceCheckResult> {
  const now = new Date();

  const [totalActive, expired, upcomingExpire, total] = await Promise.all([
    prisma.subscription.count({
      where: {
        user: { associationId },
        status: 'ACTIVE',
      },
    }),
    prisma.subscription.count({
      where: {
        user: { associationId },
        status: 'EXPIRED',
      },
    }),
    prisma.subscription.count({
      where: {
        user: { associationId },
        status: 'ACTIVE',
        endDate: {
          gte: now,
          lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.subscription.count({
      where: { user: { associationId } },
    }),
  ]);

  const score = total > 0 ? (totalActive / total) * 100 : 100;

  let status: ComplianceCheckStatus = 'PASSED';
  if (expired > totalActive * 0.2) status = 'FAILED';
  else if (upcomingExpire > 0) status = 'WARNING';

  return {
    checkType: 'SUBSCRIPTION_EXPIRY',
    status,
    score: Math.round(score),
    message: `${totalActive} active, ${upcomingExpire} expiring within 30 days`,
    details: { total, totalActive, expired, upcomingExpire },
    recommendations:
      upcomingExpire > 0 ? ['Send renewal reminders to members with expiring subscriptions'] : [],
    checkedAt: new Date(),
  };
}

async function checkMemberDataCompleteness(associationId: string): Promise<ComplianceCheckResult> {
  const users = await prisma.user.findMany({
    where: { associationId, status: UserStatus.ACTIVE },
    select: {
      id: true,
      email: true,
      name: true,
      mobile: true,
      designation: true,
      dateOfJoiningGovt: true,
      dateOfJoiningAssociation: true,
      membershipNumber: true,
    },
  });

  const total = users.length;

  if (total === 0) {
    return {
      checkType: 'MEMBER_DATA_COMPLETENESS',
      status: 'WARNING',
      score: 100,
      message: 'No active members to check',
      details: { totalMembers: 0 },
      checkedAt: new Date(),
    };
  }

  const completeness = {
    email: users.filter((u) => u.email).length,
    name: users.filter((u) => u.name).length,
    mobile: users.filter((u) => u.mobile).length,
    designation: users.filter((u) => u.designation).length,
    dateOfJoiningGovt: users.filter((u) => u.dateOfJoiningGovt).length,
    dateOfJoiningAssociation: users.filter((u) => u.dateOfJoiningAssociation).length,
    membershipNumber: users.filter((u) => u.membershipNumber).length,
  };

  const avgScore =
    Object.values(completeness).reduce((sum, c) => sum + c, 0) /
    (Object.keys(completeness).length * total);

  let status: ComplianceCheckStatus = 'PASSED';
  if (avgScore < 70) status = 'FAILED';
  else if (avgScore < 85) status = 'WARNING';

  const missingFields = Object.entries(completeness)
    .filter(([, count]) => count / total < 0.8)
    .map(([field]) => field);

  return {
    checkType: 'MEMBER_DATA_COMPLETENESS',
    status,
    score: Math.round(avgScore * 100),
    message: `Average field completeness: ${(avgScore * 100).toFixed(1)}%`,
    details: { totalMembers: total, completeness },
    recommendations:
      missingFields.length > 0 ? [`Complete missing data for: ${missingFields.join(', ')}`] : [],
    checkedAt: new Date(),
  };
}

async function checkPaymentReconciliation(associationId: string): Promise<ComplianceCheckResult> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [total, completed, pending, failed] = await Promise.all([
    prisma.paymentTransaction.count({
      where: {
        associationId,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.paymentTransaction.count({
      where: {
        associationId,
        status: PaymentStatus.COMPLETED,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.paymentTransaction.count({
      where: {
        associationId,
        status: PaymentStatus.PENDING,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
    prisma.paymentTransaction.count({
      where: {
        associationId,
        status: PaymentStatus.FAILED,
        createdAt: { gte: thirtyDaysAgo },
      },
    }),
  ]);

  const successRate = total > 0 ? (completed / total) * 100 : 100;

  let status: ComplianceCheckStatus = 'PASSED';
  if (successRate < 70) status = 'FAILED';
  else if (successRate < 85) status = 'WARNING';

  return {
    checkType: 'PAYMENT_RECONCILIATION',
    status,
    score: Math.round(successRate),
    message: `${successRate.toFixed(1)}% payment success rate`,
    details: { total, completed, pending, failed, period: '30d' },
    recommendations:
      successRate < 85 ? ['Review failed payment reasons', 'Contact affected members'] : [],
    checkedAt: new Date(),
  };
}

async function checkAuditLogIntegrity(associationId: string): Promise<ComplianceCheckResult> {
  const recentLogs = await prisma.auditLog.findMany({
    where: { associationId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  const logsWithNullTrace = recentLogs.filter((l) => !l.traceId).length;
  const logsWithNullActor = recentLogs.filter((l) => !l.actorId).length;

  const integrityScore =
    recentLogs.length > 0
      ? ((recentLogs.length - logsWithNullTrace - logsWithNullActor) / recentLogs.length) * 100
      : 100;

  let status: ComplianceCheckStatus = 'PASSED';
  if (integrityScore < 80) status = 'FAILED';
  else if (integrityScore < 95) status = 'WARNING';

  return {
    checkType: 'AUDIT_LOG_INTEGRITY',
    status,
    score: Math.round(integrityScore),
    message: `Audit log integrity score: ${integrityScore.toFixed(1)}%`,
    details: {
      recentLogsChecked: recentLogs.length,
      missingTraceIds: logsWithNullTrace,
      missingActorIds: logsWithNullActor,
    },
    recommendations: logsWithNullTrace > 0 ? ['Ensure traceId is set in all API handlers'] : [],
    checkedAt: new Date(),
  };
}

export async function generateComplianceEvidence(
  associationId: string,
  days: number = 30,
): Promise<ComplianceEvidence> {
  const now = new Date();
  const from = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  const [consentData, dsarData, memberData, paymentData, auditData] = await Promise.all([
    getConsentEvidence(associationId, from, now, days),
    getDsarEvidence(associationId, from, now),
    getMemberEvidence(associationId),
    getPaymentEvidence(associationId, from, now),
    getAuditEvidence(associationId, from, now),
  ]);

  return {
    generatedAt: now,
    associationId,
    period: { from, to: now },
    sections: {
      consentCoverage: consentData,
      dsarCompliance: dsarData,
      memberData,
      paymentRecords: paymentData,
      auditLogs: auditData,
    },
  };
}

async function getConsentEvidence(associationId: string, from: Date, to: Date, days: number) {
  const records = await prisma.consentReceipt.findMany({
    where: { associationId, createdAt: { gte: from, lte: to } },
    select: { purpose: true, status: true },
  });

  const grouped = records.reduce(
    (acc, r) => {
      const key = `${r.purpose}_${r.status}`;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    type: 'consent_records',
    description: `Consent records by purpose and status (last ${days} days)`,
    count: records.length,
    metadata: grouped,
  };
}

async function getDsarEvidence(associationId: string, from: Date, to: Date) {
  const tickets = await prisma.dsarTicket.findMany({
    where: { associationId, createdAt: { gte: from, lte: to } },
    select: { status: true, requestType: true },
  });

  const grouped = tickets.reduce(
    (acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    type: 'dsar_tickets',
    description: 'DSAR tickets by status',
    count: tickets.length,
    metadata: grouped,
  };
}

async function getMemberEvidence(associationId: string) {
  const [total, active, withSubscription] = await Promise.all([
    prisma.user.count({ where: { associationId } }),
    prisma.user.count({ where: { associationId, status: UserStatus.ACTIVE } }),
    prisma.user.count({
      where: { associationId, subscription: { isNot: null } },
    }),
  ]);

  return {
    type: 'member_summary',
    description: 'Member statistics',
    count: total,
    metadata: { active, withSubscription },
  };
}

async function getPaymentEvidence(associationId: string, from: Date, to: Date) {
  const payments = await prisma.paymentTransaction.groupBy({
    by: ['status'],
    where: { associationId, createdAt: { gte: from, lte: to } },
    _count: { id: true },
  });

  const grouped = payments.reduce(
    (acc, p) => {
      acc[p.status] = p._count.id;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    type: 'payment_transactions',
    description: 'Payment transactions by status',
    count: payments.reduce((sum, p) => sum + p._count.id, 0),
    metadata: grouped,
  };
}

async function getAuditEvidence(associationId: string, from: Date, to: Date) {
  const logs = await prisma.auditLog.groupBy({
    by: ['action'],
    where: { associationId, createdAt: { gte: from, lte: to } },
    _count: { id: true },
  });

  const grouped = logs.reduce(
    (acc, l) => {
      acc[l.action] = l._count.id;
      return acc;
    },
    {} as Record<string, number>,
  );

  return {
    type: 'audit_logs',
    description: 'Audit logs by action type',
    count: logs.reduce((sum, l) => sum + l._count.id, 0),
    metadata: grouped,
  };
}
