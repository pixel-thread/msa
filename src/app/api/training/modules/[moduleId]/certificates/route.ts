import { env } from '@src/env';
import { prisma } from '@lib/prisma';
import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { ForbiddenError, BadRequestError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { findManyCertificates, createCertificate } from '@feature/training/services';
import { CreateTrainingCertificateSchema } from '@feature/training/validators/training';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const TrainingParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError('Invalid module ID');
    }

    logger.info(
      { traceId, associationId: association.id },
      'GET /training/modules/{moduleId}/certificates - Request started',
    );

    await withRole(request, UserRole.MEMBER);
    logger.info({ traceId }, 'GET /training/modules/{moduleId}/certificates - User authorized');

    const { moduleId } = params;

    const certificates = await findManyCertificates({
      associationId: association.id,
      moduleId,
    });

    logger.info({ traceId }, 'GET /training/modules/{moduleId}/certificates - Success');
    return SuccessResponse({ data: certificates });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError('Invalid module ID');
    }

    logger.info(
      { traceId, associationId: association.id },
      'POST /training/modules/{moduleId}/certificates - Request started',
    );

    const { moduleId } = params;

    const user = await withRole(request, UserRole.DPO);
    logger.info(
      { traceId, userId: user.id },
      'POST /training/modules/{moduleId}/certificates - User authorized',
    );

    const formData = await request.formData();

    const file = formData.get('file') as File | null;

    const metadataRaw = formData.get('metadata') as string | null;

    if (!file || !metadataRaw) {
      throw new BadRequestError('File and metadata are required');
    }

    let metadata: z.infer<typeof CreateTrainingCertificateSchema>;
    logger.info({ traceId }, 'POST /training/modules/{moduleId}/certificates - Parsing metadata');
    try {
      const parsed = JSON.parse(metadataRaw);
      metadata = CreateTrainingCertificateSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestError('Invalid metadata JSON');
      }
      throw error;
    }

    if (!file.size || file.size === 0) {
      throw new BadRequestError('File is empty');
    }

    logger.info({ traceId }, 'POST /training/modules/{moduleId}/certificates - Uploading file');
    const uploadResult = await uploadToBucket(file, `certificates/${association.slug}/${moduleId}`);

    logger.info(
      {
        traceId,
        storedName: uploadResult.key,
      },
      'POST /training/modules/{moduleId}/certificates - Creating file record',
    );
    const fileRecord = await prisma.file.create({
      data: {
        associationId: association.id,
        originalName: file.name,
        storedName: uploadResult.key || '',
        mimeType: uploadResult.mimeType,
        extension: file.name.split('.').pop() || null,
        sizeBytes: uploadResult.sizeBytes,
        bucket: env.STORAGE_BUCKET,
        storageKey: uploadResult.key,
        url: uploadResult.url,
        uploadedById: user.id,
      },
    });

    logger.info(
      { traceId },
      'POST /training/modules/{moduleId}/certificates - Creating certificate record',
    );
    const certificate = await createCertificate({
      associationId: association.id,
      moduleId,
      actorId: user.id,
      data: metadata,
      certificateUrl: uploadResult.url,
      fileId: fileRecord.id,
    });

    logger.info(
      { traceId, certificateId: certificate.id },
      'POST /training/modules/{moduleId}/certificates - Success',
    );
    return SuccessResponse({ data: certificate }, 201);
  },
);
