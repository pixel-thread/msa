import { env } from '@src/env';
import { prisma } from '@lib/prisma';
import { withAssociation, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { ForbiddenError, BadRequestError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { completeAssignment } from '@feature/training/services';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
  userId: z.uuid('Invalid user ID'),
});

const MetadataSchema = z.object({
  scorePercent: z.number().min(0).max(100).optional(),
  certificateOption: z.enum(['none', 'global', 'custom']).default('none'),
  certificateNumber: z.string().max(100).optional(),
});

export const POST = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError('Invalid parameters');
    }

    logger.info(
      { traceId, associationId: association.id },
      'POST /training/modules/{moduleId}/assignments/{userId}/complete - Request started',
    );

    const { moduleId, userId } = params;
    const actor = await withRole(request, UserRole.SECRETARY);
    logger.info(
      { traceId, userId: actor.id },
      'POST /training/modules/{moduleId}/assignments/{userId}/complete - User authorized',
    );

    const contentType = request.headers.get('content-type') || '';

    let scorePercent: number | undefined;
    let certificateOption: 'none' | 'global' | 'custom' = 'none';
    let certificateNumber: string | undefined;
    let file: File | null = null;

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const metadataRaw = formData.get('metadata') as string | null;
      file = formData.get('file') as File | null;

      if (!metadataRaw) {
        throw new BadRequestError('Metadata is required');
      }

      let metadata: z.infer<typeof MetadataSchema>;
      try {
        const parsed = JSON.parse(metadataRaw);
        metadata = MetadataSchema.parse(parsed);
      } catch (error) {
        if (error instanceof SyntaxError) {
          throw new BadRequestError('Invalid metadata JSON');
        }
        throw error;
      }

      scorePercent = metadata.scorePercent;
      certificateOption = metadata.certificateOption;
      certificateNumber = metadata.certificateNumber;
    } else {
      const body = await request.json().catch(() => null);

      if (!body) {
        throw new BadRequestError('Invalid request body');
      }

      const parsed = MetadataSchema.parse(body);
      scorePercent = parsed.scorePercent;
      certificateOption = parsed.certificateOption;
      certificateNumber = parsed.certificateNumber;
    }

    try {
      let certificateUrl: string | undefined;
      let certificateFileId: string | undefined;

      if (certificateOption === 'custom' && file && file.size > 0) {
        const uploadResult = await uploadToBucket(
          file,
          `certificates/${association.slug}/${moduleId}`,
        );

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
            uploadedById: actor.id,
          },
        });

        certificateUrl = uploadResult.url;
        certificateFileId = fileRecord.id;
      }

      logger.info(
        { traceId, moduleId, targetUserId: userId },
        'POST /training/modules/{moduleId}/assignments/{userId}/complete - Completing assignment',
      );

      const result = await completeAssignment({
        associationId: association.id,
        moduleId,
        userId,
        actorId: actor.id,
        scorePercent,
        certificateOption,
        certificateUrl,
        certificateFileId,
        certificateNumber,
      });

      logger.info(
        { traceId },
        'POST /training/modules/{moduleId}/assignments/{userId}/complete - Success',
      );
      return SuccessResponse({ data: result }, 201);
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestError(error.message);
      }
      throw new BadRequestError('Failed to complete assignment');
    }
  },
);
