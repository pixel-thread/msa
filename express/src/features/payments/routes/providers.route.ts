import { Request, Response } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError, BadRequestError, NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
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
import { createTestPaymentOrder, verifyTestPayment } from '@src/features/payments/services/payment.service';

async function getAssociation(req: Request) {
  const userId = req.headers['x-user-id'] as string;
  if (!userId) throw new UnauthorizedError('Unauthorized');
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { association: true } });
  if (!user || !user.associationId) throw new ForbiddenError('User association not found');
  return { id: user.association.id, slug: user.association.slug, name: user.association.name };
}

export const listProviders = [
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId }, 'GET /api/payments/providers - Request started');
    const association = await getAssociation(req);
    const providers = await getProvidersByAssociation(association.id);
    logger.info({ traceId, count: providers.length }, 'GET /api/payments/providers - Success');
    return success(res, { data: providers });
  },
];

export const createProviderHandler = [
  validate({ body: UpsertPaymentProviderSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, provider: req.body.provider }, 'POST /api/payments/providers - Request started');
    const association = await getAssociation(req);
    const result = await createProvider({
      associationId: association.id,
      provider: req.body.provider,
      keyId: req.body.keyId,
      keySecret: req.body.keySecret,
      webhookSecret: req.body.webhookSecret,
      isActive: req.body.isActive,
    });
    logger.info({ traceId, providerId: result.id }, 'POST /api/payments/providers - Success');
    return success(res, { data: result }, 201);
  },
];

export const providerStatus = [
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId }, 'GET /api/payments/providers/status - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.MEMBER)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, userId: user.id }, 'GET /api/payments/providers/status - User authorized');
    const providerByAssociation = await getProvidersByAssociation(association.id);
    if (!providerByAssociation) throw new NotFoundError('No Provider setup');
    const activeProvider = await getActiveProvider(association.id);
    if (!activeProvider) throw new NotFoundError('Provider not found');
    logger.info({ traceId, isActive: activeProvider.isActive }, 'GET /api/payments/providers/status - Success');
    return success(res, { data: { status: activeProvider.isActive } });
  },
];

export const getProvider = [
  validate({ params: ProviderIdParamSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, providerId: req.params.providerId }, 'GET /api/payments/providers/[providerId] - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.PRESIDENT)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, providerId: req.params.providerId }, 'GET /api/payments/providers/[providerId] - User authorized');
    const provider = await getProviderById(req.params.providerId, association.id);
    if (!provider) throw new NotFoundError('Provider not found');
    logger.info({ traceId, providerId: req.params.providerId }, 'GET /api/payments/providers/[providerId] - Success');
    return success(res, { data: provider });
  },
];

export const updateProviderHandler = [
  validate({ params: ProviderIdParamSchema, body: UpdatePaymentProviderSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, providerId: req.params.providerId }, 'PATCH /api/payments/providers/[providerId] - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.PRESIDENT)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, providerId: req.params.providerId }, 'PATCH /api/payments/providers/[providerId] - User authorized');
    logger.info({ traceId, providerId: req.params.providerId }, 'PATCH /api/payments/providers/[providerId] - Updating provider');
    const result = await updateProvider(req.params.providerId, association.id, {
      keyId: req.body?.keyId,
      keySecret: req.body?.keySecret,
      webhookSecret: req.body?.webhookSecret,
      isActive: req.body?.isActive,
    });
    logger.info({ traceId, providerId: req.params.providerId }, 'PATCH /api/payments/providers/[providerId] - Success');
    return success(res, { data: result });
  },
];

export const deleteProviderHandler = [
  validate({ params: ProviderIdParamSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, providerId: req.params.providerId }, 'DELETE /api/payments/providers/[providerId] - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.PRESIDENT)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, providerId: req.params.providerId }, 'DELETE /api/payments/providers/[providerId] - User authorized');
    await deleteProvider(req.params.providerId, association.id);
    logger.info({ traceId, providerId: req.params.providerId }, 'DELETE /api/payments/providers/[providerId] - Success');
    return success(res, { data: null, message: 'Provider deleted successfully' });
  },
];

export const activateProvider = [
  validate({ params: ProviderIdParamSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, providerId: req.params?.providerId }, 'POST /api/payments/providers/[providerId]/activate - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.PRESIDENT)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, providerId: req.params?.providerId }, 'POST /api/payments/providers/[providerId]/activate - User authorized');
    const providerId = req.params?.providerId;
    if (!providerId) throw new BadRequestError('Invalid provider ID');
    const provderExist = await getProviderById(providerId, association.id);
    if (!provderExist) throw new NotFoundError('Provider not found');
    logger.info({ traceId, providerId }, 'POST /api/payments/providers/[providerId]/activate - Toggling provider activation');
    const result = await setActiveProvider(provderExist.id, association.id);
    const activatedMessage = 'Provider successfully activated';
    const deActivatedMessage = 'Provider successfully de-activated';
    logger.info({ traceId, providerId, isActive: result.isActive }, 'POST /api/payments/providers/[providerId]/activate - Success');
    return success(res, { data: result, message: result.isActive ? activatedMessage : deActivatedMessage });
  },
];

export const testProvider = [
  validate({ params: ProviderIdParamSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId, providerId: req.params.providerId }, 'POST /api/payments/providers/[providerId]/test - Request started');
    const association = await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!user || !user.role.includes(UserRole.PRESIDENT)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId, userId: user.id, providerId: req.params.providerId }, 'POST /api/payments/providers/[providerId]/test - User authorized');
    const provider = await getProviderById(req.params.providerId, association.id);
    if (!provider) throw new NotFoundError('Provider not found');
    if (provider.provider !== 'RAZORPAY') {
      throw new BadRequestError('Test payments are only supported for Razorpay providers');
    }
    logger.info({ traceId, providerId: req.params.providerId }, 'POST /api/payments/providers/[providerId]/test - Creating test payment order');
    const options = await createTestPaymentOrder({
      associationId: association.id,
      userId: user.id,
      providerId: req.params.providerId,
    });
    logger.info({ traceId, providerId: req.params.providerId, orderId: (options as any).id }, 'POST /api/payments/providers/[providerId]/test - Success');
    return success(res, { data: options }, 201);
  },
];

export const verifyTestProvider = [
  validate({ params: ProviderIdParamSchema, body: VerifyPaymentSchema }),
  async (req: Request, res: Response) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    logger.info({ traceId }, 'POST /api/payments/providers/[providerId]/test/verify - Request started');
    await getAssociation(req);
    const userId = req.headers['x-user-id'] as string;
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });
    if (!user || !user.role.includes(UserRole.PRESIDENT)) {
      throw new ForbiddenError('Insufficient permissions');
    }
    logger.info({ traceId }, 'POST /api/payments/providers/[providerId]/test/verify - User authorized');
    logger.info({ traceId, razorpayOrderId: req.body.razorpayOrderId }, 'POST /api/payments/providers/[providerId]/test/verify - Verifying test payment');
    const result = await verifyTestPayment({
      razorpayOrderId: req.body.razorpayOrderId,
      razorpayPaymentId: req.body.razorpayPaymentId,
      razorpaySignature: req.body.razorpaySignature,
    });
    logger.info({ traceId }, 'POST /api/payments/providers/[providerId]/test/verify - Success');
    return success(res, { data: result, message: 'Test payment verified and completed successfully' });
  },
];
