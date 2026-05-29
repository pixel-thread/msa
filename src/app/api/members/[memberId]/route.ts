import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@src/shared/utils/responses';
import { NotFoundError, ValidationError } from '@src/shared/errors';
import { findFirstMember } from '@src/features/members/services/findFirstMember';
import { updateMember } from '@src/features/members/services/updateMember';
import { UserRole } from '@prisma/client';
import z from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamSchema = z.object({ memberId: z.uuid() });

export const GET = withAssociation(
  { params: ParamSchema },
  async (association, { params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'GET /api/members/[memberId] - Request started',
    );

    const user = await withRole(request, UserRole.DPO);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'GET /api/members/[memberId] - User authorized',
    );

    const member = await findFirstMember({
      where: {
        id: params?.memberId,
        associationId: association.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        membershipNumber: true,
        designation: true,
        mobile: true,
        dateOfJoiningGovt: true,
        dateOfJoiningAssociation: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            meetingAttendances: true,
          },
        },
      },
    });

    if (!member || member.id !== params?.memberId) {
      throw new NotFoundError('Member not found');
    }

    logger.info(
      {
        traceId,
        memberId: params?.memberId,
      },
      'GET /api/members/[memberId] - Success',
    );

    return SuccessResponse({ data: member });
  },
);

const AdminOnboardingSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  mobile: z
    .string()
    .min(10, 'Mobile must be 10 digits')
    .max(10, 'Mobile must be 10 digits')
    .regex(/^[0-9]+$/, 'Mobile should contain only numbers')
    .optional(),
  designation: z.string().optional(),
  dateOfJoiningGovt: z.coerce.date().optional(),
  dateOfJoiningAssociation: z.coerce.date().optional(),
  membershipNumber: z.string().optional(),
  associationId: z.uuid(),
});

export const PATCH = withAssociation(
  { body: AdminOnboardingSchema, params: ParamSchema },
  async (association, { body, params, traceId }, request) => {
    logger.info(
      {
        traceId,
        associationId: association.id,
      },
      'PATCH /api/members/[memberId] - Request started',
    );

    const user = await withRole(request, UserRole.SECRETARY);

    logger.info(
      {
        traceId,
        userId: user.id,
      },
      'PATCH /api/members/[memberId] - User authorized',
    );

    if (!body) {
      throw new ValidationError('Invalid request body');
    }

    const memberId = params?.memberId;

    const updatedUser = await updateMember({
      where: { id: memberId },
      data: {
        ...(body.name && { name: body.name }),
        ...(body.mobile && { mobile: body.mobile }),
        ...(body.designation && { designation: body.designation }),
        ...(body.dateOfJoiningGovt && {
          dateOfJoiningGovt: body.dateOfJoiningGovt,
        }),
        ...(body.dateOfJoiningAssociation && {
          dateOfJoiningAssociation: body.dateOfJoiningAssociation,
        }),
        ...(body.membershipNumber && {
          membershipNumber: body.membershipNumber,
        }),
        ...(body.associationId && {
          associationId: body.associationId,
        }),
      },
    });

    logger.info(
      {
        traceId,
        memberId,
      },
      'PATCH /api/members/[memberId] - Success',
    );

    return SuccessResponse({
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        designation: updatedUser.designation,
        membershipNumber: updatedUser.membershipNumber,
        dateOfJoiningGovt: updatedUser.dateOfJoiningGovt,
        dateOfJoiningAssociation: updatedUser.dateOfJoiningAssociation,
      },
    });
  },
);
