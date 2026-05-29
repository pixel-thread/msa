import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { ComplianceCheckParamsSchema } from '@src/features/compliance/validators';
import { findUniqueComplianceCheck, deleteComplianceCheck } from '@src/features/compliance/services';
import { logger } from '@src/shared/logger/server';

export const GET = withAssociation(
  { params: ComplianceCheckParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id, checkId: params?.checkId },
      'GET /api/compliance/checks/[checkId] - Request started',
    );
    const user = await withRole(request, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'GET /api/compliance/checks/[checkId] - User authorized',
    );

    if (!params) {
      logger.error({ traceId }, 'GET /api/compliance/checks/[checkId] - Invalid check ID');
      throw new BadRequestError('Invalid check ID');
    }

    const check = await findUniqueComplianceCheck({
      where: { id: params.checkId, associationId: association.id },
    });

    if (!check) {
      logger.error(
        { traceId, checkId: params.checkId },
        'GET /api/compliance/checks/[checkId] - Compliance check not found',
      );
      throw new NotFoundError('Compliance check not found');
    }

    logger.info(
      { traceId, checkId: params.checkId },
      'GET /api/compliance/checks/[checkId] - Success',
    );

    return SuccessResponse({ data: check });
  },
);

export const DELETE = withAssociation(
  { params: ComplianceCheckParamsSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id, checkId: params?.checkId },
      'DELETE /api/compliance/checks/[checkId] - Request started',
    );
    const user = await withRole(request, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id, roles: user.role },
      'DELETE /api/compliance/checks/[checkId] - User authorized',
    );

    if (!params) {
      logger.error({ traceId }, 'DELETE /api/compliance/checks/[checkId] - Invalid check ID');
      throw new BadRequestError('Invalid check ID');
    }

    const existing = await findUniqueComplianceCheck({
      where: { id: params.checkId, associationId: association.id },
    });

    if (!existing) {
      logger.error(
        { traceId, checkId: params.checkId },
        'DELETE /api/compliance/checks/[checkId] - Compliance check not found',
      );
      throw new NotFoundError('Compliance check not found');
    }

    await deleteComplianceCheck({
      where: { id: params.checkId },
    });

    logger.info(
      { traceId, checkId: params.checkId },
      'DELETE /api/compliance/checks/[checkId] - Success',
    );

    return SuccessResponse({
      data: null,
      message: 'Compliance check deleted successfully',
    });
  },
);
