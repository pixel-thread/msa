import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  findManyCompletions,
  recordCompletion,
  completeAssignment,
} from '@src/features/training/services';
import { RecordCompletionSchema } from '@src/features/training/validators/training';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';
import { BadRequestError } from '@src/shared/errors';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';
import { z } from 'zod';

const ModuleParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
});

const AssignmentParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
  userId: z.string().uuid('Invalid user ID'),
});

const MetadataSchema = z.object({
  scorePercent: z.number().min(0).max(100).optional(),
  certificateOption: z.enum(['none', 'global', 'custom']).default('none'),
  certificateNumber: z.string().max(100).optional(),
});

export const getModuleCompletions: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id },
        'GET /training/modules/{moduleId}/complete - Request started',
      );
      await withRole(req, UserRole.MEMBER);
      logger.info({ traceId }, 'GET /training/modules/{moduleId}/complete - User authorized');

      const data = await findManyCompletions({
        associationId: association.id,
        moduleId: req.params.moduleId,
      });

      logger.info({ traceId }, 'GET /training/modules/{moduleId}/complete - Success');
      return success(res, { data: data.completions, meta: data.pagination });
    } catch (e) {
      next(e);
    }
  },
];

export const postModuleComplete: RequestHandler[] = [
  validate({ params: ModuleParamsSchema, body: RecordCompletionSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id },
        'POST /training/modules/{moduleId}/complete - Request started',
      );
      const user = await withRole(req, UserRole.SUPER_ADMIN);
      logger.info(
        { traceId, userId: user.id },
        'POST /training/modules/{moduleId}/complete - User authorized',
      );

      const completion = await recordCompletion({
        associationId: association.id,
        userId: user.id,
        moduleId: req.params.moduleId,
        data: req.body,
      });

      logger.info(
        { traceId, completionId: completion.id },
        'POST /training/modules/{moduleId}/complete - Success',
      );
      return success(res, { data: completion }, 201);
    } catch (e) {
      next(e);
    }
  },
];

export const postAdminComplete: RequestHandler[] = [
  validate({ params: AssignmentParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id },
        'POST /training/modules/{moduleId}/assignments/{userId}/complete - Request started',
      );
      const actor = await withRole(req, UserRole.SECRETARY);
      logger.info(
        { traceId, userId: actor.id },
        'POST /training/modules/{moduleId}/assignments/{userId}/complete - User authorized',
      );

      const { moduleId, userId } = req.params;
      const contentType = req.headers['content-type'] || '';

      let scorePercent: number | undefined;
      let certificateOption: 'none' | 'global' | 'custom' = 'none';
      let certificateNumber: string | undefined;
      let file: Express.Multer.File | undefined;

      if (contentType.includes('multipart/form-data')) {
        const metadataRaw = req.body.metadata as string | undefined;
        file = (req as any).file as Express.Multer.File | undefined;

        if (!metadataRaw) {
          throw new BadRequestError('Metadata is required');
        }

        let metadata: z.infer<typeof MetadataSchema>;
        try {
          const parsed = JSON.parse(metadataRaw);
          metadata = MetadataSchema.parse(parsed);
        } catch (error) {
          if (error instanceof SyntaxError) throw new BadRequestError('Invalid metadata JSON');
          throw error;
        }

        scorePercent = metadata.scorePercent;
        certificateOption = metadata.certificateOption;
        certificateNumber = metadata.certificateNumber;
      } else {
        if (!req.body) throw new BadRequestError('Invalid request body');
        const parsed = MetadataSchema.parse(req.body);
        scorePercent = parsed.scorePercent;
        certificateOption = parsed.certificateOption;
        certificateNumber = parsed.certificateNumber;
      }

      try {
        let certificateUrl: string | undefined;
        let certificateFileId: string | undefined;

        if (certificateOption === 'custom' && file && file.size > 0) {
          const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
          const uploadResult = await uploadToBucket(
            webFile,
            `certificates/${association.slug}/${moduleId}`,
            traceId,
          );

          const fileRecord = await prisma.file.create({
            data: {
              associationId: association.id,
              originalName: file.originalname,
              storedName: uploadResult.key,
              mimeType: uploadResult.mimeType,
              extension: file.originalname.split('.').pop() || null,
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
        return success(res, { data: result }, 201);
      } catch (error) {
        if (error instanceof Error) throw new BadRequestError(error.message);
        throw new BadRequestError('Failed to complete assignment');
      }
    } catch (e) {
      next(e);
    }
  },
];
