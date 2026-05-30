// ---- Consent service
// ---- Business intent: Manage user consent records in compliance with DPDP Act 2023.
// ---- Each consent action is persisted as a receipt and audited via the audit-log trail.

// Shared utilities
import { NotFoundError, BadRequestError } from '@src/shared/errors';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils';

// Prisma
import { prisma } from '@src/shared/lib/prisma';
import { AuditAction, ConsentPurpose, ConsentStatus, Prisma } from '@prisma/client';

// Types
import {
  UserConsentState,
  ConsentReceiptRecord,
  ConsentSummaryReport,
} from '../types/consent.types';
import { PaginationMeta } from '@src/shared/types';

// Validators
import {
  ConsentUpdateInput,
  UpdateConsentReceiptInput,
  AllConsentRecordsQueryInput,
} from '../validators/consent.validators';

// ---- Service class

/**
 * Service for managing user consent according to DPDP Act 2023.
 *
 * Handles consent grant/withdraw, retrieval of consent states,
 * reporting, and audit-logging of all consent receipt changes.
 */
export class ConsentService {
  // ---- getUserConsentState

  /**
   * Retrieve the current consent state for a user across all purposes.
   *
   * Returns the latest status per purpose by ordering receipts by creation date
   * and using distinct on purpose.
   *
   * @param userId - The ID of the user.
   * @param associationId - The ID of the association.
   * @returns A promise that resolves to an array of UserConsentState objects.
   */
  static async getUserConsentState(
    userId: string,
    associationId: string,
  ): Promise<UserConsentState[]> {
    const states = await prisma.consentReceipt.findMany({
      where: {
        userId,
        associationId,
      },
      distinct: ['purpose'],
      orderBy: {
        createdAt: 'desc',
      },
    });

    return states.map((s) => ({
      purpose: s.purpose,
      status: s.status,
      updatedAt: s.createdAt,
    }));
  }

  // ---- updateConsent

  /**
   * Update consent for a user for one or more purposes.
   *
   * Creates a new consent receipt for each purpose atomically in a transaction.
   * Supports both grant and withdraw actions via the action field.
   *
   * @param userId - The ID of the user.
   * @param associationId - The ID of the association.
   * @param input - The consent update data (purposes, action, channel, etc.).
   * @param ipAddress - Optional IP address of the request.
   * @param userAgent - Optional user agent of the request.
   * @returns A promise that resolves to the created consent receipts.
   */
  static async updateConsent(
    userId: string,
    associationId: string,
    input: ConsentUpdateInput,
    ipAddress?: string,
    userAgent?: string,
  ): Promise<ConsentReceiptRecord[]> {
    const { purposes, action, channel, metadata } = input;

    // ---- Create one receipt per purpose in a single transaction

    const receipts = await prisma.$transaction(
      purposes.map((purpose) =>
        prisma.consentReceipt.create({
          data: {
            userId,
            associationId,
            purpose,
            status: action,
            channel,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            // TODO: wire up actual metadata handling (currently stubbed with `{} as any`)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: (metadata || {}) as any,
          },
        }),
      ),
    );

    return receipts as ConsentReceiptRecord[];
  }

  // ---- getConsentHistory

  /**
   * Retrieve the consent history for a specific user.
   *
   * Returns paginated consent receipts sorted by creation date descending.
   *
   * @param userId - The ID of the user.
   * @param associationId - The ID of the association.
   * @param page - Page number for pagination.
   * @returns A promise that resolves to an array of ConsentReceiptRecord objects and pagination metadata.
   */
  static async getConsentHistory(
    userId: string,
    associationId: string,
    page?: number,
  ): Promise<{ history: ConsentReceiptRecord[]; pagination: PaginationMeta }> {
    const pageNumber = page || 1;

    // ---- Fetch receipts and total count concurrently

    const [history, total] = await prisma.$transaction([
      prisma.consentReceipt.findMany({
        where: {
          userId,
          associationId,
        },
        skip: (pageNumber - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        orderBy: {
          createdAt: 'desc',
        },
      }),

      prisma.consentReceipt.count({
        where: {
          userId,
          associationId,
        },
      }),
    ]);

    return {
      history,
      pagination: buildPagination(total, pageNumber),
    };
  }

  // ---- getConsentReport

  /**
   * Generate a report of consent statuses across the association.
   *
   * For each consent purpose, counts how many users have granted vs withdrawn.
   * Uses a raw query to get the latest status per user per purpose.
   *
   * @param associationId - The ID of the association.
   * @returns A promise that resolves to an array of ConsentSummaryReport objects.
   */
  static async getConsentReport(associationId: string): Promise<ConsentSummaryReport[]> {
    const purposes = Object.values(ConsentPurpose);
    const report: ConsentSummaryReport[] = [];

    for (const purpose of purposes) {
      // Get the latest consent status for each user for this purpose
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const latestConsents = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT ON ("userId") status
        FROM "consent_receipts"
        WHERE "associationId" = ${associationId} AND "purpose" = ${purpose}::"consent_purpose"
        ORDER BY "userId", "createdAt" DESC
      `;

      const grantedCount = latestConsents.filter((c) => c.status === ConsentStatus.GRANTED).length;
      const totalCount = latestConsents.length;

      report.push({
        purpose,
        grantedCount,
        withdrawnCount: totalCount - grantedCount,
        totalCount,
      });
    }

    return report;
  }

  // ---- getAllConsentRecords

  /**
   * Retrieve all consent records for the association with pagination and filtering.
   *
   * Supports filtering by purpose, status, and text search (user name/email).
   *
   * @param associationId - The ID of the association.
   * @param query - Pagination and filter options.
   * @returns Paginated consent records and total count.
   */
  static async getAllConsentRecords(
    associationId: string,
    query?: AllConsentRecordsQueryInput,
  ): Promise<{ records: ConsentReceiptRecord[]; total: number }> {
    const page = query?.page ?? 1;
    const skip = (page - 1) * PAGE_SIZE;

    // ---- Build dynamic where clause from query parameters

    const where: Prisma.ConsentReceiptWhereInput = { associationId };

    if (query?.purpose) {
      where.purpose = query.purpose;
    }
    if (query?.status) {
      where.status = query.status;
    }
    if (query?.search) {
      where.user = {
        OR: [
          { name: { contains: query.search, mode: 'insensitive' } },
          { email: { contains: query.search, mode: 'insensitive' } },
        ],
      };
    }

    // ---- Fetch records and total count concurrently

    const [records, total] = await Promise.all([
      prisma.consentReceipt.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: PAGE_SIZE,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
      prisma.consentReceipt.count({ where }),
    ]);

    return { records: records as unknown as ConsentReceiptRecord[], total };
  }

  // ---- findUniqueConsentReceipt

  /**
   * Find a single consent receipt by ID within a specific association.
   *
   * Used for individual receipt lookup by DPO users.
   *
   * @param associationId - The association ID.
   * @param receiptId - The receipt ID to look up.
   * @returns The consent receipt or null if not found.
   */
  static async findUniqueConsentReceipt(
    associationId: string,
    receiptId: string,
  ): Promise<ConsentReceiptRecord | null> {
    const receipt = await prisma.consentReceipt.findFirst({
      where: { id: receiptId, associationId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
    });
    return receipt as unknown as ConsentReceiptRecord | null;
  }

  // ---- updateConsentReceipt

  /**
   * Update a single consent receipt and log the change in the audit trail.
   *
   * Uses a transaction to atomically update the receipt and create an audit log entry.
   * Only DPO users are authorized to perform this operation.
   *
   * @param associationId - The association ID.
   * @param receiptId - The receipt ID to update.
   * @param actorId - The user ID performing the update.
   * @param data - The fields to update.
   * @returns The updated consent receipt.
   */
  static async updateConsentReceipt(
    associationId: string,
    receiptId: string,
    actorId: string,
    data: UpdateConsentReceiptInput,
  ): Promise<ConsentReceiptRecord> {
    // ---- Verify the receipt exists before attempting update

    const existing = await prisma.consentReceipt.findFirst({
      where: { id: receiptId, associationId },
    });
    if (!existing) throw new NotFoundError('Consent receipt not found');

    // ---- Atomically update receipt and write audit log

    return (await prisma.$transaction(async (tx) => {
      const updated = await tx.consentReceipt.update({
        where: { id: receiptId },
        data,
      });

      await tx.auditLog.create({
        data: {
          associationId,
          actorId,
          action: AuditAction.UPDATE,
          resourceType: 'ConsentReceipt',
          resourceId: receiptId,
          oldValues: {
            status: existing.status,
            channel: existing.channel,
          } as Prisma.InputJsonValue,
          newValues: data as Prisma.InputJsonValue,
        },
      });

      return updated;
    })) as unknown as ConsentReceiptRecord;
  }

  // ---- deleteConsentReceipt

  /**
   * Delete a single consent receipt and log the action in the audit trail.
   *
   * Uses a transaction to atomically delete the receipt and create an audit log entry.
   * Only DPO users are authorized to perform this operation.
   *
   * @param associationId - The association ID.
   * @param receiptId - The receipt ID to delete.
   * @param actorId - The user ID performing the deletion.
   */
  static async deleteConsentReceipt(
    associationId: string,
    receiptId: string,
    actorId: string,
  ): Promise<void> {
    // ---- Verify the receipt exists before attempting deletion

    const existing = await prisma.consentReceipt.findFirst({
      where: { id: receiptId, associationId },
    });
    if (!existing) throw new NotFoundError('Consent receipt not found');

    // ---- Atomically delete receipt and write audit log

    await prisma.$transaction(async (tx) => {
      await tx.consentReceipt.delete({ where: { id: receiptId } });

      await tx.auditLog.create({
        data: {
          associationId,
          actorId,
          action: AuditAction.DELETE,
          resourceType: 'ConsentReceipt',
          resourceId: receiptId,
          oldValues: {
            purpose: existing.purpose,
            status: existing.status,
          } as Prisma.InputJsonValue,
        },
      });
    });
  }

  // ---- getUserConsentHistoryById

  /**
   * Get consent history for a specific user (admin/DPO view).
   *
   * Returns paginated consent receipts for the target user,
   * including associated user profile info (name, email).
   *
   * @param userId - The target user ID.
   * @param associationId - The association ID.
   * @param page - Page number for pagination.
   * @returns Paginated consent records and metadata.
   */
  static async getUserConsentHistoryById(
    userId: string,
    associationId: string,
    page: number,
  ): Promise<{ records: ConsentReceiptRecord[]; pagination: PaginationMeta }> {
    // ---- Fetch records and total count concurrently

    const [records, total] = await prisma.$transaction([
      prisma.consentReceipt.findMany({
        where: { userId, associationId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),

      prisma.consentReceipt.count({
        where: { userId, associationId },
      }),
    ]);

    return {
      records: records as ConsentReceiptRecord[],
      pagination: buildPagination(total, page),
    };
  }
}
