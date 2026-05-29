import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { AuditAction, ConsentPurpose, ConsentStatus, Prisma } from '@prisma/client';
import {
  UserConsentState,
  ConsentReceiptRecord,
  ConsentSummaryReport,
} from '../types/consent.types';
import {
  ConsentUpdateInput,
  UpdateConsentReceiptInput,
  AllConsentRecordsQueryInput,
} from '../validators/consent.validators';
import { NotFoundError, BadRequestError } from '@src/shared/errors';
import { PAGE_SIZE } from '@src/shared/constants';
import { buildPagination } from '@src/shared/utils';
import { PaginationMeta } from '@src/shared/types';

/**
 * Service for managing user consent according to DPDP Act 2023.
 */
export class ConsentService {
  /**
   * Retrieves the current consent state for a user across all purposes.
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

  /**
   * Updates consent for a user for one or more purposes.
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: (metadata || {}) as any,
          },
        }),
      ),
    );

    return receipts as ConsentReceiptRecord[];
  }

  /**
   * Retrieves the consent history for a specific user.
   *
   * @param userId - The ID of the user.
   * @param associationId - The ID of the association.
   * @returns A promise that resolves to an array of ConsentReceiptRecord objects.
   */
  static async getConsentHistory(
    userId: string,
    associationId: string,
    page?: number,
  ): Promise<{ history: ConsentReceiptRecord[]; pagination: PaginationMeta }> {
    const pageNumber = page || 1;

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

  /**
   * Generates a report of consent statuses across the association.
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

  /**
   * Retrieves all consent records for the association with pagination and filtering.
   * @param associationId - The ID of the association.
   * @param query - Pagination and filter options.
   */
  static async getAllConsentRecords(
    associationId: string,
    query?: AllConsentRecordsQueryInput,
  ): Promise<{ records: ConsentReceiptRecord[]; total: number }> {
    const page = query?.page ?? 1;
    const skip = (page - 1) * PAGE_SIZE;

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

  /**
   * Finds a single consent receipt by ID.
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

  /**
   * Updates a single consent receipt.
   */
  static async updateConsentReceipt(
    associationId: string,
    receiptId: string,
    actorId: string,
    data: UpdateConsentReceiptInput,
  ): Promise<ConsentReceiptRecord> {
    const existing = await prisma.consentReceipt.findFirst({
      where: { id: receiptId, associationId },
    });
    if (!existing) throw new NotFoundError('Consent receipt not found');

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

  /**
   * Deletes a single consent receipt.
   */
  static async deleteConsentReceipt(
    associationId: string,
    receiptId: string,
    actorId: string,
  ): Promise<void> {
    const existing = await prisma.consentReceipt.findFirst({
      where: { id: receiptId, associationId },
    });
    if (!existing) throw new NotFoundError('Consent receipt not found');

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

  /**
   * Gets consent history for a specific user (admin view).
   */
  static async getUserConsentHistoryById(
    userId: string,
    associationId: string,
    page: number,
  ): Promise<{ records: ConsentReceiptRecord[]; pagination: PaginationMeta }> {
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
