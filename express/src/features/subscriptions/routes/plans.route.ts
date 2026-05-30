import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { CreateSubscriptionPlanSchema } from '@feature/subscriptions/validators';
import {
  getPlans,
  createPlan,
  setDefaultPlan,
  updatePlan,
  softDeletePlan,
} from '@feature/subscriptions/services';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { logger } from '@src/shared/logger';
import { z } from 'zod';

/** Schema for updating a subscription plan (all fields optional). */
const UpdatePlanSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  amount: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']).optional(),
  features: z.record(z.string(), z.any()).optional(),
  isActive: z.boolean().optional(),
  memberTypeId: z.uuid().optional().nullable(),
});

/** Schema for setting a default plan. */
const SetDefaultPlanSchema = z.object({
  planId: z.uuid(),
});

/** Schema for plan ID path parameter. */
const PlanParamsSchema = z.object({ planId: z.string().uuid() });

/** GET /api/subscriptions/plans - List subscription plans. */
export const getPlansHandler: RequestHandler[] = [
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, role: user.role }, 'GET /api/subscriptions/plans - Fetching plans');
    const data = await getPlans(association.id, user);
    return success(res, { data });
  },
];

/** POST /api/subscriptions/plans - Create a new subscription plan (SUPER_ADMIN role required). */
export const createPlanHandler: RequestHandler[] = [
  validate({ body: CreateSubscriptionPlanSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    await withRole(req, UserRole.SUPER_ADMIN);
    if (!req.body) throw new ValidationError('Invalid request body');
    logger.info({ traceId, name: req.body.name }, 'Creating new plan');
    const plan = await createPlan(association.id, req.body);
    return success(res, { data: plan }, 201);
  },
];

/** POST /api/subscriptions/plans/default - Set a plan as the default (SUPER_ADMIN role required). */
export const setDefaultPlanHandler: RequestHandler[] = [
  validate({ body: SetDefaultPlanSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    await withRole(req, UserRole.SUPER_ADMIN);
    if (!req.body) throw new ValidationError('Invalid request body');
    logger.info({ traceId, planId: req.body.planId }, 'Setting plan as default');
    const updated = await setDefaultPlan(association.id, req.body.planId);
    return success(res, { data: updated });
  },
];

/** PATCH /api/subscriptions/plans/:planId - Update a subscription plan (SUPER_ADMIN role required). */
export const updatePlanHandler: RequestHandler[] = [
  validate({ body: UpdatePlanSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id },
      'PATCH /api/subscriptions/plans/[planId] - User authorized',
    );
    if (!req.body) throw new ValidationError('Invalid request body');
    const { planId } = req.params;
    const updatedPlan = await updatePlan(association.id, planId, req.body);
    logger.info({ traceId, planId }, 'Plan updated successfully');
    return success(res, { data: updatedPlan });
  },
];

/** DELETE /api/subscriptions/plans/:planId - Soft-delete a plan (PRESIDENT role required). */
export const deletePlanHandler: RequestHandler[] = [
  validate({ params: PlanParamsSchema }),
  async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    const association = await getAssociation(req);
    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id },
      'DELETE /api/subscriptions/plans/[planId] - User authorized',
    );
    const { planId } = req.params;
    const plan = await softDeletePlan(association.id, planId);
    logger.info({ traceId, planId }, 'Plan deleted successfully');
    return success(res, { data: plan, message: 'Plan deleted successfully' });
  },
];
