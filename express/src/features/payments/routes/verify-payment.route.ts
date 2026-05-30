import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { prisma } from '@src/shared/lib/prisma';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { logger } from '@src/shared/logger';
import { UnauthorizedError, ForbiddenError } from '@src/shared/errors';
import { VerifyPaymentSchema } from '@src/features/payments/validators';
import { verifyAndCompletePayment } from '@src/features/payments/services/payment.service';

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

export const verifyPayment: RequestHandler[] = [
  validate({ body: VerifyPaymentSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    logger.info(
      { traceId, razorpayOrderId: req.body.razorpayOrderId },
      'POST /api/payments/verify - Request started',
    );
    await getAssociation(req);
    logger.info(
      { traceId, razorpayOrderId: req.body.razorpayOrderId },
      'POST /api/payments/verify - Verifying payment',
    );
    const result = await verifyAndCompletePayment({
      razorpayOrderId: req.body.razorpayOrderId,
      razorpayPaymentId: req.body.razorpayPaymentId,
      razorpaySignature: req.body.razorpaySignature,
    });
    logger.info(
      { traceId, razorpayOrderId: req.body.razorpayOrderId },
      'POST /api/payments/verify - Success',
    );
    return success(
      res,
      { data: result, message: 'Payment verified and completed successfully' },
      200,
    );
  },
];
