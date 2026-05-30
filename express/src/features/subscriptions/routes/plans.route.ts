// ---------------------------------------------------------------------------
// External libs
// ---------------------------------------------------------------------------
import { Request, NextFunction, Response } from 'express';
import type { RequestHandler } from 'express';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Shared utilities
// ---------------------------------------------------------------------------
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { ValidationError } from '@src/shared/errors';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';

// ---------------------------------------------------------------------------
// Prisma
// ---------------------------------------------------------------------------
import { UserRole } from '@prisma/client';

// ---------------------------------------------------------------------------
// Services
// ---------------------------------------------------------------------------
import {
  getPlans,
  createPlan,
  setDefaultPlan,
  updatePlan,
  softDeletePlan,
} from '@feature/subscriptions/services';

// ---------------------------------------------------------------------------
// Validators / Types
// ---------------------------------------------------------------------------
import { CreateSubscriptionPlanSchema } from '@feature/subscriptions/validators';

// ---- Schemas ----------------------------------------------------------------

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
const PlanParamsSchema = z.object({ planId: z.uuid() });

// ---- GET /api/subscriptions/plans -------------------------------------------
/** @desc  List subscription plans for the association
 *  @role  MEMBER */
export const getPlansHandler: RequestHandler[] = [
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);

    // Authorize user — MEMBER is sufficient to list plans
    const user = await withRole(req, UserRole.MEMBER);
    logger.info({ traceId, role: user.role }, 'GET /api/subscriptions/plans - Fetching plans');

    // Retrieve plans scoped to association and user's role/member-type
    const data = await getPlans(association.id, user);

    return success(res, { data });
  }),
];

// ---- POST /api/subscriptions/plans ------------------------------------------
/** @desc  Create a new subscription plan with an initial version
 *  @role  SUPER_ADMIN */
export const createPlanHandler: RequestHandler[] = [
  validate({ body: CreateSubscriptionPlanSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);

    // Authorize user — only SUPER_ADMIN may create plans
    await withRole(req, UserRole.SUPER_ADMIN);

    if (!req.body) throw new ValidationError('Invalid request body');

    logger.info({ traceId, name: req.body.name }, 'Creating new plan');

    // Delegate creation to service (handles transactional plan + version)
    const plan = await createPlan(association.id, req.body);

    return success(res, { data: plan }, 201);
  }),
];

// ---- POST /api/subscriptions/plans/default -----------------------------------
/** @desc  Set a plan as the default for the association
 *  @role  SUPER_ADMIN */
export const setDefaultPlanHandler: RequestHandler[] = [
  validate({ body: SetDefaultPlanSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);

    // Authorize user — only SUPER_ADMIN may change the default
    await withRole(req, UserRole.SUPER_ADMIN);

    if (!req.body) throw new ValidationError('Invalid request body');

    logger.info({ traceId, planId: req.body.planId }, 'Setting plan as default');

    const updated = await setDefaultPlan(association.id, req.body.planId);

    return success(res, { data: updated });
  }),
];

// ---- PATCH /api/subscriptions/plans/:planId ----------------------------------
/** @desc  Update a subscription plan (creates new version if price changes)
 *  @role  SUPER_ADMIN */
export const updatePlanHandler: RequestHandler[] = [
  validate({ body: UpdatePlanSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);

    // Authorize user — only SUPER_ADMIN may update plans
    const user = await withRole(req, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id },
      'PATCH /api/subscriptions/plans/[planId] - User authorized',
    );

    if (!req.body) throw new ValidationError('Invalid request body');

    const { planId } = req.params;

    // Apply partial update; price changes trigger a new version
    const updatedPlan = await updatePlan(association.id, planId as string, req.body);

    logger.info({ traceId, planId }, 'Plan updated successfully');

    return success(res, { data: updatedPlan });
  }),
];

// ---- DELETE /api/subscriptions/plans/:planId ---------------------------------
/** @desc  Soft-delete a plan by setting isActive = false
 *  @role  PRESIDENT */
export const deletePlanHandler: RequestHandler[] = [
  validate({ params: PlanParamsSchema }),
  asyncHandler(async (req: Request, res: Response, _next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Validate association membership
    const association = await getAssociation(req);

    // Authorize user — PRESIDENT role required for deletion
    const user = await withRole(req, UserRole.PRESIDENT);
    logger.info(
      { traceId, userId: user.id },
      'DELETE /api/subscriptions/plans/[planId] - User authorized',
    );

    const { planId } = req.params;

    const plan = await softDeletePlan(association.id, planId as string);

    logger.info({ traceId, planId }, 'Plan deleted successfully');

    return success(res, { data: plan, message: 'Plan deleted successfully' });
  }),
];
