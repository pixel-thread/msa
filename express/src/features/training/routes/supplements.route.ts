import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  findManySupplements,
  createSupplement,
  updateSupplement,
  deleteSupplement,
} from '@src/features/training/services';
import {
  CreateSupplementSchema,
  UpdateSupplementSchema,
} from '@src/features/training/validators/training';
import { uploadToBucket, deleteFromBucket } from '@src/shared/lib/supabase/storage';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { z } from 'zod';

const ModuleParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
});

const SupplementParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
  supplementId: z.string().uuid('Invalid supplement ID'),
});

export const getSupplements: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id },
        'GET /training/modules/{moduleId}/supplements - Request started',
      );
      await withRole(req, UserRole.MEMBER);
      logger.info({ traceId }, 'GET /training/modules/{moduleId}/supplements - User authorized');

      const supplements = await findManySupplements({
        associationId: association.id,
        moduleId: req.params.moduleId,
      });

      logger.info({ traceId }, 'GET /training/modules/{moduleId}/supplements - Success');
      return success(res, { data: supplements });
    } catch (e) {
      next(e);
    }
  },
];

export const postSupplement: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id, moduleId: req.params.moduleId },
        'POST /training/modules/{moduleId}/supplements - Request started',
      );
      const user = await withRole(req, UserRole.DPO);
      logger.info(
        { traceId, userId: user.id },
        'POST /training/modules/{moduleId}/supplements - User authorized',
      );

      const { moduleId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!file || !metadataRaw) {
        throw new BadRequestError('File and metadata are required');
      }

      let metadata: z.infer<typeof CreateSupplementSchema>;
      try {
        metadata = CreateSupplementSchema.parse(JSON.parse(metadataRaw));
      } catch (error) {
        if (error instanceof SyntaxError) throw new BadRequestError('Invalid metadata JSON');
        throw error;
      }

      if (!file.size || file.size === 0) {
        throw new BadRequestError('File is empty');
      }

      const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
      const uploadResult = await uploadToBucket(
        webFile,
        `supplements/${association.slug}/${moduleId}`,
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
      return success(res, { data: supplement }, 201);
    } catch (e) {
      next(e);
    }
  },
];

export const getSupplement: RequestHandler[] = [
  validate({ params: SupplementParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id },
        'GET /training/modules/{moduleId}/supplements/{supplementId} - Request started',
      );
      await withRole(req, UserRole.MEMBER);
      logger.info(
        { traceId },
        'GET /training/modules/{moduleId}/supplements/{supplementId} - User authorized',
      );

      const { moduleId, supplementId } = req.params;
      const supplements = await findManySupplements({ associationId: association.id, moduleId });
      const supplement = supplements.find((s) => s.id === supplementId);

      if (!supplement) throw new NotFoundError('Training supplement not found');

      logger.info(
        { traceId, supplementId },
        'GET /training/modules/{moduleId}/supplements/{supplementId} - Success',
      );
      return success(res, { data: supplement });
    } catch (e) {
      next(e);
    }
  },
];

export const updateSupplementHandler: RequestHandler[] = [
  validate({ params: SupplementParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id },
        'PATCH /training/modules/{moduleId}/supplements/{supplementId} - Request started',
      );
      const user = await withRole(req, UserRole.DPO);
      logger.info(
        { traceId, userId: user.id },
        'PATCH /training/modules/{moduleId}/supplements/{supplementId} - User authorized',
      );

      const { moduleId, supplementId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!metadataRaw) {
        throw new BadRequestError('Metadata is required');
      }

      let metadata: z.infer<typeof UpdateSupplementSchema>;
      try {
        metadata = UpdateSupplementSchema.parse(JSON.parse(metadataRaw));
      } catch (error) {
        if (error instanceof SyntaxError) throw new BadRequestError('Invalid metadata JSON');
        throw error;
      }

      let downloadUrl: string | undefined;
      let fileId: string | undefined;

      if (file) {
        if (!file.size || file.size === 0) {
          throw new BadRequestError('File is empty');
        }

        const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
        const uploadResult = await uploadToBucket(
          webFile,
          `supplements/${association.slug}/${moduleId}`,
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
            uploadedById: user.id,
          },
        });

        downloadUrl = uploadResult.url;
        fileId = fileRecord.id;
      }

      const { supplement, oldStorageKey } = await updateSupplement({
        associationId: association.id,
        moduleId,
        supplementId,
        actorId: user.id,
        data: metadata,
        downloadUrl,
        fileId,
      });

      if (oldStorageKey) {
        try {
          await deleteFromBucket(oldStorageKey);
        } catch {
          /* best-effort cleanup */
        }
      }

      logger.info(
        { traceId, supplementId },
        'PATCH /training/modules/{moduleId}/supplements/{supplementId} - Success',
      );
      return success(res, { data: supplement });
    } catch (e) {
      next(e);
    }
  },
];

export const deleteSupplementHandler: RequestHandler[] = [
  validate({ params: SupplementParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info(
        { traceId, associationId: association.id },
        'DELETE /training/modules/{moduleId}/supplements/{supplementId} - Request started',
      );
      const user = await withRole(req, UserRole.DPO);
      logger.info(
        { traceId, userId: user.id },
        'DELETE /training/modules/{moduleId}/supplements/{supplementId} - User authorized',
      );

      const { moduleId, supplementId } = req.params;
      const result = await deleteSupplement({
        associationId: association.id,
        moduleId,
        supplementId,
        actorId: user.id,
      });

      if (result.storageKey) {
        try {
          await deleteFromBucket(result.storageKey);
        } catch {
          /* best-effort cleanup */
        }
      }

      logger.info(
        { traceId, supplementId },
        'DELETE /training/modules/{moduleId}/supplements/{supplementId} - Success',
      );
      return success(res, { data: { success: true, message: 'Training supplement deleted' } });
    } catch (e) {
      next(e);
    }
  },
];
