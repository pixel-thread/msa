// ---------------------------------------------------------------------------
// ENDPOINT:  CRUD /api/payments/providers
// SECURITY:  President role for mutations, Member for read/status checks
// PURPOSE:   Manage payment providers per association — create, read, update,
//            delete, activate/deactivate, and test connectivity.
// ---------------------------------------------------------------------------

import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';

import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
} from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { withRole } from '@src/shared/utils/with-role';
import {
  UpsertPaymentProviderSchema,
  UpdatePaymentProviderSchema,
  ProviderIdParamSchema,
  VerifyPaymentSchema,
} from '@src/features/payments/validators';
import {
  getProvidersByAssociation,
  createProvider,
  getProviderById,
  updateProvider,
  deleteProvider,
  setActiveProvider,
  getActiveProvider,
} from '@src/features/payments/services/payment-provider.service';
import {
  createTestPaymentOrder,
  verifyTestPayment,
} from '@src/features/payments/services/payment.service';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Helpers ----

/**
 * Resolve the authenticated user's association for multi-tenant scoping.
 */
async function getAssociation(req: Request) {
  const userId = req.userId as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { association: true },
  });

  if (!user || !user.associationId) throw new ForbiddenError('User association not found');

  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

// ===========================================================================
// LIST GET /api/payments/providers
// ===========================================================================

export const listProviders: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info({ traceId }, 'GET /api/payments/providers - Request started');

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Business logic: list all providers ---
    const providers = await getProvidersByAssociation(association.id);

    // --- Log: success ---
    logger.info({ traceId, count: providers.length }, 'GET /api/payments/providers - Success');

    // --- Response ---
    return success(res, { data: providers });
  }),
];

// ===========================================================================
// CREATE POST /api/payments/providers
// ===========================================================================

export const createProviderHandler: RequestHandler[] = [
  // Step 1: Validate request body
  validate({ body: UpsertPaymentProviderSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, provider: req.body.provider },
      'POST /api/payments/providers - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Business logic: create provider ---
    const result = await createProvider({
      associationId: association.id,
      provider: req.body.provider,
      keyId: req.body.keyId,
      keySecret: req.body.keySecret,
      webhookSecret: req.body.webhookSecret,
      isActive: req.body.isActive,
    });

    // --- Log: success ---
    logger.info({ traceId, providerId: result.id }, 'POST /api/payments/providers - Success');

    // --- Response ---
    return success(res, { data: result }, 201);
  }),
];

// ===========================================================================
// STATUS GET /api/payments/providers/status
// ===========================================================================

export const providerStatus: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info({ traceId }, 'GET /api/payments/providers/status - Request started');

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce MEMBER role ---
    const user = await withRole(req, UserRole.MEMBER);
    logger.info(
      { traceId, userId: user.id },
      'GET /api/payments/providers/status - User authorized',
    );

    // --- Business logic: check provider status ---
    const providerByAssociation = await getProvidersByAssociation(association.id);
    if (!providerByAssociation) throw new NotFoundError('No Provider setup');
    const activeProvider = await getActiveProvider(association.id);
    if (!activeProvider) throw new NotFoundError('Provider not found');

    // --- Log: success ---
    logger.info(
      { traceId, isActive: activeProvider.isActive },
      'GET /api/payments/providers/status - Success',
    );

    // --- Response ---
    return success(res, { data: { status: activeProvider.isActive } });
  }),
];

// ===========================================================================
// GET /api/payments/providers/:providerId
// ===========================================================================

export const getProvider: RequestHandler[] = [
  // Step 1: Validate path params
  validate({ params: ProviderIdParamSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'GET /api/payments/providers/[providerId] - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce PRESIDENT role ---
    await withRole(req, UserRole.PRESIDENT);

    logger.info(
      { traceId, providerId: req.params.providerId },
      'GET /api/payments/providers/[providerId] - User authorized',
    );

    // --- Business logic: fetch provider ---
    const provider = await getProviderById(req.params.providerId as string, association.id);
    if (!provider) throw new NotFoundError('Provider not found');

    // --- Log: success ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'GET /api/payments/providers/[providerId] - Success',
    );

    // --- Response ---
    return success(res, { data: provider });
  }),
];

// ===========================================================================
// PATCH /api/payments/providers/:providerId
// ===========================================================================

export const updateProviderHandler: RequestHandler[] = [
  // Step 1: Validate params and body
  validate({ params: ProviderIdParamSchema, body: UpdatePaymentProviderSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'PATCH /api/payments/providers/[providerId] - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce PRESIDENT role ---
    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, providerId: req.params.providerId },
      'PATCH /api/payments/providers/[providerId] - User authorized',
    );

    // --- Business logic: update provider ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'PATCH /api/payments/providers/[providerId] - Updating provider',
    );

    const result = await updateProvider(req.params.providerId as string, association.id, {
      keyId: req.body?.keyId,
      keySecret: req.body?.keySecret,
      webhookSecret: req.body?.webhookSecret,
      isActive: req.body?.isActive,
    });

    // --- Log: success ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'PATCH /api/payments/providers/[providerId] - Success',
    );

    // --- Response ---
    return success(res, { data: result });
  }),
];

// ===========================================================================
// DELETE /api/payments/providers/:providerId
// ===========================================================================

export const deleteProviderHandler: RequestHandler[] = [
  // Step 1: Validate path params
  validate({ params: ProviderIdParamSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'DELETE /api/payments/providers/[providerId] - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce PRESIDENT role ---
    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, providerId: req.params.providerId },
      'DELETE /api/payments/providers/[providerId] - User authorized',
    );

    // --- Business logic: delete provider ---
    await deleteProvider(req.params.providerId as string, association.id);

    // --- Log: success ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'DELETE /api/payments/providers/[providerId] - Success',
    );

    // --- Response ---
    return success(res, { data: null, message: 'Provider deleted successfully' });
  }),
];

// ===========================================================================
// ACTIVATE POST /api/payments/providers/:providerId/activate
// ===========================================================================

export const activateProvider: RequestHandler[] = [
  // Step 1: Validate path params
  validate({ params: ProviderIdParamSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, providerId: req.params?.providerId },
      'POST /api/payments/providers/[providerId]/activate - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce PRESIDENT role ---
    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, providerId: req.params?.providerId },
      'POST /api/payments/providers/[providerId]/activate - User authorized',
    );

    // --- Business logic: toggle provider activation ---
    const providerId = req.params?.providerId;
    if (!providerId) throw new BadRequestError('Invalid provider ID');
    const provderExist = await getProviderById(providerId as string, association.id);
    if (!provderExist) throw new NotFoundError('Provider not found');

    logger.info(
      { traceId, providerId },
      'POST /api/payments/providers/[providerId]/activate - Toggling provider activation',
    );
    const result = await setActiveProvider(provderExist.id, association.id);
    const activatedMessage = 'Provider successfully activated';
    const deActivatedMessage = 'Provider successfully de-activated';

    // --- Log: success ---
    logger.info(
      { traceId, providerId, isActive: result.isActive },
      'POST /api/payments/providers/[providerId]/activate - Success',
    );

    // --- Response ---
    return success(res, {
      data: result,
      message: result.isActive ? activatedMessage : deActivatedMessage,
    });
  }),
];

// ===========================================================================
// TEST POST /api/payments/providers/:providerId/test
// ===========================================================================

export const testProvider: RequestHandler[] = [
  // Step 1: Validate path params
  validate({ params: ProviderIdParamSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId, providerId: req.params.providerId },
      'POST /api/payments/providers/[providerId]/test - Request started',
    );

    // --- Auth: resolve association ---
    const association = await getAssociation(req);

    // --- Auth: enforce PRESIDENT role ---
    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id, providerId: req.params.providerId },
      'POST /api/payments/providers/[providerId]/test - User authorized',
    );

    // --- Business logic: create test payment order ---
    const provider = await getProviderById(req.params.providerId as string, association.id);
    if (!provider) throw new NotFoundError('Provider not found');
    // Test payments require Razorpay — no other providers support checkout tests
    if (provider.provider !== 'RAZORPAY') {
      throw new BadRequestError('Test payments are only supported for Razorpay providers');
    }

    logger.info(
      { traceId, providerId: req.params.providerId },
      'POST /api/payments/providers/[providerId]/test - Creating test payment order',
    );
    const options = await createTestPaymentOrder({
      associationId: association.id,
      userId: user.id,
      providerId: req.params.providerId as string,
    });

    // --- Log: success ---
    logger.info(
      { traceId, providerId: req.params.providerId, orderId: (options as any).id },
      'POST /api/payments/providers/[providerId]/test - Success',
    );

    // --- Response ---
    return success(res, { data: options }, 201);
  }),
];

// ===========================================================================
// VERIFY TEST POST /api/payments/providers/:providerId/test/verify
// ===========================================================================

export const verifyTestProvider: RequestHandler[] = [
  // Step 1: Validate params and body
  validate({ params: ProviderIdParamSchema, body: VerifyPaymentSchema }),

  // Step 2: Execute
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // --- Log: request started ---
    logger.info(
      { traceId },
      'POST /api/payments/providers/[providerId]/test/verify - Request started',
    );

    // --- Auth: resolve association ---
    await getAssociation(req);

    // --- Auth: enforce PRESIDENT role ---
    await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId },
      'POST /api/payments/providers/[providerId]/test/verify - User authorized',
    );

    // --- Business logic: verify test payment signature ---
    logger.info(
      { traceId, razorpayOrderId: req.body.razorpayOrderId },
      'POST /api/payments/providers/[providerId]/test/verify - Verifying test payment',
    );
    const result = await verifyTestPayment({
      razorpayOrderId: req.body.razorpayOrderId,
      razorpayPaymentId: req.body.razorpayPaymentId,
      razorpaySignature: req.body.razorpaySignature,
    });

    // --- Log: success ---
    logger.info({ traceId }, 'POST /api/payments/providers/[providerId]/test/verify - Success');

    // --- Response ---
    return success(res, {
      data: result,
      message: 'Test payment verified and completed successfully',
    });
  }),
];
