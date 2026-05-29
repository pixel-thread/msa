import { env } from '@src/env';
import { prisma } from '@lib/prisma';
import { withAssociation, withRole, withAssociationFormData, zjson } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { ForbiddenError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findManySupplements, createSupplement } from '@feature/training/services';
import { CreateSupplementSchema } from '@feature/training/validators/training';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const TrainingParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
});

const SupplementFormSchema = z.object({
  file: z
    .instanceof(File, { message: 'File is required' })
    .refine((f) => f.size > 0, 'File is empty'),
  metadata: zjson(CreateSupplementSchema),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError('Invalid module ID');
    }

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/modules/{moduleId}/supplements - Request started',
    );

    await withRole(request, UserRole.MEMBER);
    logger.info({ traceId }, 'GET /training/modules/{moduleId}/supplements - User authorized');

    const { moduleId } = params;

    const supplements = await findManySupplements({
      associationId: association.id,
      moduleId,
    });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/supplements - Success');
    return SuccessResponse({ data: supplements });
  },
);

export const POST = withAssociationFormData(
  {
    params: TrainingParamsSchema,
    formData: SupplementFormSchema,
  },
  async (association, { formData, params, traceId }, request) => {
    const { moduleId } = params!;

    logger.info(
      { traceId, associationId: association.id, moduleId },
      'POST /training/modules/{moduleId}/supplements - Request started',
    );

    const user = await withRole(request, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id },
      'POST /training/modules/{moduleId}/supplements - User authorized',
    );

    const { file, metadata } = formData;

    const uploadResult = await uploadToBucket(file, `supplements/${association.slug}/${moduleId}`);

    const fileRecord = await prisma.file.create({
      data: {
        associationId: association.id,
        originalName: file.name,
        storedName: uploadResult.key,
        mimeType: uploadResult.mimeType,
        extension: file.name.split('.').pop() || null,
        sizeBytes: uploadResult.sizeBytes,
        bucket: env.STORAGE_BUCKET,
        storageKey: uploadResult.key,
        url: uploadResult.url,
        uploadedById: user.id,
      },
    });

    const supplement = await createSupplement({
      associationId: association.id,
      moduleId,
      actorId: user.id,
      data: metadata,
      downloadUrl: uploadResult.url,
      fileId: fileRecord.id,
    });

    logger.info(
      { traceId, supplementId: supplement.id },
      'POST /training/modules/{moduleId}/supplements - Success',
    );
    return SuccessResponse({ data: supplement }, 201);
  },
);
