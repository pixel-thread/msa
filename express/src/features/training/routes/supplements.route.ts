// ---- External libs ----
import { Request, Response, NextFunction } from 'express';
import type { RequestHandler } from 'express';

// ---- Shared utilities ----
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { uploadToBucket, deleteFromBucket } from '@src/shared/lib/supabase/storage';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import { getAssociation } from '@src/shared/services/association/get-association';
import { withRole } from '@src/shared/utils/with-role';
import { asyncHandler } from '@src/shared/utils/async-handler';

// ---- Prisma ----
import { UserRole } from '@prisma/client';

// ---- Services ----
import {
  findManySupplements,
  createSupplement,
  updateSupplement,
  deleteSupplement,
} from '@src/features/training/services';

// ---- Validators ----
import {
  CreateSupplementSchema,
  UpdateSupplementSchema,
} from '@src/features/training/validators/training';

// ---- External libs ----
import { z } from 'zod';

// ---- Schemas ----

/** Schema for module ID path parameter. */
const ModuleParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
});

/** Schema for module + supplement ID path parameters. */
const SupplementParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
  supplementId: z.uuid('Invalid supplement ID'),
});

// ---------------------------------------------------------------------------
// GET /training/modules/:moduleId/supplements
// Description: List supplements for a module
// Security:    MEMBER role required
// ---------------------------------------------------------------------------

export const getSupplements: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve association
    try {
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'GET /training/modules/{moduleId}/supplements - Request started',
      );

      // Authorize: minimum MEMBER role
      await withRole(req, UserRole.MEMBER);

      logger.info({ traceId }, 'GET /training/modules/{moduleId}/supplements - User authorized');

      // Fetch supplements
      const supplements = await findManySupplements({
        associationId: association.id,
        moduleId: req.params.moduleId as string,
      });

      logger.info({ traceId }, 'GET /training/modules/{moduleId}/supplements - Success');
      return success(res, { data: supplements });
    } catch (e) {
      next(e);
    }
  }),
];

// ---------------------------------------------------------------------------
// POST /training/modules/:moduleId/supplements
// Description: Upload a supplement file
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const postSupplement: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve association
    try {
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id, moduleId: req.params.moduleId },
        'POST /training/modules/{moduleId}/supplements - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'POST /training/modules/{moduleId}/supplements - User authorized',
      );

      // Parse request: file + metadata JSON
      const { moduleId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!file || !metadataRaw) {
        throw new BadRequestError('File and metadata are required');
      }

      // Validate metadata against schema
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

      // Upload file to Supabase storage
      const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
      const uploadResult = await uploadToBucket(
        webFile,
        `supplements/${association.slug}/${moduleId}`,
        traceId,
      );

      // Create a File record in the database
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

      // Create the supplement record
      const supplement = await createSupplement({
        associationId: association.id,
        moduleId: moduleId as string,
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
  }),
];

// ---------------------------------------------------------------------------
// GET /training/modules/:moduleId/supplements/:supplementId
// Description: Retrieve a single supplement
// Security:    MEMBER role required
// ---------------------------------------------------------------------------

export const getSupplement: RequestHandler[] = [
  validate({ params: SupplementParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve association
    try {
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'GET /training/modules/{moduleId}/supplements/{supplementId} - Request started',
      );

      // Authorize: minimum MEMBER role
      await withRole(req, UserRole.MEMBER);

      logger.info(
        { traceId },
        'GET /training/modules/{moduleId}/supplements/{supplementId} - User authorized',
      );

      // Find supplement by filtering the module's supplement list
      const { moduleId, supplementId } = req.params;
      const supplements = await findManySupplements({
        associationId: association.id,
        moduleId: moduleId as string,
      });
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
  }),
];

// ---------------------------------------------------------------------------
// PATCH /training/modules/:moduleId/supplements/:supplementId
// Description: Update a supplement (optionally replace file)
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const updateSupplementHandler: RequestHandler[] = [
  validate({ params: SupplementParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve association
    try {
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'PATCH /training/modules/{moduleId}/supplements/{supplementId} - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'PATCH /training/modules/{moduleId}/supplements/{supplementId} - User authorized',
      );

      // Parse request: optional file + required metadata JSON
      const { moduleId, supplementId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!metadataRaw) {
        throw new BadRequestError('Metadata is required');
      }

      // Validate metadata
      let metadata: z.infer<typeof UpdateSupplementSchema>;
      try {
        metadata = UpdateSupplementSchema.parse(JSON.parse(metadataRaw));
      } catch (error) {
        if (error instanceof SyntaxError) throw new BadRequestError('Invalid metadata JSON');
        throw error;
      }

      // Upload new file if provided
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

      // Apply the update (old file cleanup happens in service)
      const { supplement, oldStorageKey } = await updateSupplement({
        associationId: association.id,
        moduleId: moduleId as string,
        supplementId: supplementId as string,
        actorId: user.id,
        data: metadata,
        downloadUrl,
        fileId,
      });

      // Clean up old file from storage
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
  }),
];

// ---------------------------------------------------------------------------
// DELETE /training/modules/:moduleId/supplements/:supplementId
// Description: Delete a supplement and its file
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const deleteSupplementHandler: RequestHandler[] = [
  validate({ params: SupplementParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    // Resolve association
    try {
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'DELETE /training/modules/{moduleId}/supplements/{supplementId} - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'DELETE /training/modules/{moduleId}/supplements/{supplementId} - User authorized',
      );

      // Delete the supplement (cascades to file record)
      const { moduleId, supplementId } = req.params;
      const result = await deleteSupplement({
        associationId: association.id,
        moduleId: moduleId as string,
        supplementId: supplementId as string,
        actorId: user.id,
      });

      // Clean up file from storage
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
  }),
];
