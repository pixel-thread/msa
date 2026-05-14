import { prisma } from "@src/shared/lib/prisma";
import { ConsentPurpose, ConsentStatus } from "@prisma/client";
import { 
  UserConsentState, 
  ConsentReceiptRecord, 
  ConsentSummaryReport 
} from "../types/consent.types";
import { ConsentUpdateInput } from "../validators/consent.validators";

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
  static async getUserConsentState(userId: string, associationId: string): Promise<UserConsentState[]> {
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

    return states.map(s => ({
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
    userAgent?: string
  ): Promise<ConsentReceiptRecord[]> {
    const { purposes, action, channel, metadata } = input;

    const receipts = await prisma.$transaction(
      purposes.map(purpose => 
        prisma.consentReceipt.create({
          data: {
            userId,
            associationId,
            purpose,
            status: action,
            channel,
            ipAddress: ipAddress || null,
            userAgent: userAgent || null,
            metadata: (metadata || {}) as any,
          },
        })
      )
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
  static async getConsentHistory(userId: string, associationId: string): Promise<ConsentReceiptRecord[]> {
    const history = await prisma.consentReceipt.findMany({
      where: {
        userId,
        associationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return history as ConsentReceiptRecord[];
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
      const latestConsents = await prisma.$queryRaw<any[]>`
        SELECT DISTINCT ON ("userId") status
        FROM "consent_receipts"
        WHERE "associationId" = ${associationId} AND "purpose" = ${purpose}::"consent_purpose"
        ORDER BY "userId", "createdAt" DESC
      `;

      const grantedCount = latestConsents.filter(c => c.status === ConsentStatus.GRANTED).length;
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
   * Retrieves all consent records for the association (Admin/DPO only).
   * 
   * @param associationId - The ID of the association.
   * @param limit - Optional limit for pagination.
   * @returns A promise that resolves to an array of ConsentReceiptRecord objects.
   */
  static async getAllConsentRecords(associationId: string, limit = 100): Promise<ConsentReceiptRecord[]> {
    const records = await prisma.consentReceipt.findMany({
      where: {
        associationId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return records as unknown as ConsentReceiptRecord[];
  }
}
