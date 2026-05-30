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
  findManyCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  createCertificateTemplate,
  deleteCertificateTemplate,
} from '@src/features/training/services';

// ---- Validators ----
import {
  CreateTrainingCertificateSchema,
  UpdateTrainingCertificateSchema,
} from '@src/features/training/validators/training';

// ---- External libs ----
import { z } from 'zod';

// ---- Schemas ----

/** Schema for module ID path parameter. */
const ModuleParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
});

/** Schema for module + certificate ID path parameters. */
const CertificateParamsSchema = z.object({
  moduleId: z.uuid('Invalid module ID'),
  certificateId: z.uuid('Invalid certificate ID'),
});

// ---------------------------------------------------------------------------
// GET /training/modules/:moduleId/certificates
// Description: List certificates for a module
// Security:    MEMBER role required
// ---------------------------------------------------------------------------

export const getCertificates: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    try {
      // Resolve association
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'GET /training/modules/{moduleId}/certificates - Request started',
      );

      // Authorize: minimum MEMBER role
      await withRole(req, UserRole.MEMBER);

      logger.info({ traceId }, 'GET /training/modules/{moduleId}/certificates - User authorized');

      // Fetch certificates
      const certificates = await findManyCertificates({
        associationId: association.id,
        moduleId: req.params.moduleId as string,
      });

      logger.info({ traceId }, 'GET /training/modules/{moduleId}/certificates - Success');
      return success(res, { data: certificates });
    } catch (e) {
      next(e);
    }
  }),
];

// ---------------------------------------------------------------------------
// POST /training/modules/:moduleId/certificates
// Description: Upload a certificate for a user
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const postCertificate: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    try {
      // Resolve association
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'POST /training/modules/{moduleId}/certificates - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'POST /training/modules/{moduleId}/certificates - User authorized',
      );

      // Parse request: file + metadata JSON
      const { moduleId } = req.params;

      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!file || !metadataRaw) {
        throw new BadRequestError('File and metadata are required');
      }

      // Validate metadata against schema
      let metadata: z.infer<typeof CreateTrainingCertificateSchema>;
      try {
        metadata = CreateTrainingCertificateSchema.parse(JSON.parse(metadataRaw));
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
        `certificates/${association.slug}/${moduleId}`,
        traceId,
      );

      // Create a File record in the database
      const fileRecord = await prisma.file.create({
        data: {
          associationId: association.id,
          originalName: file.originalname,
          storedName: uploadResult.key || '',
          mimeType: uploadResult.mimeType,
          extension: file.originalname.split('.').pop() || null,
          sizeBytes: uploadResult.sizeBytes,
          bucket: env.STORAGE_BUCKET,
          storageKey: uploadResult.key,
          url: uploadResult.url,
          uploadedById: user.id,
        },
      });

      // Create the certificate record
      const certificate = await createCertificate({
        associationId: association.id,
        moduleId: moduleId as string,
        actorId: user.id,
        data: metadata,
        certificateUrl: uploadResult.url,
        fileId: fileRecord.id,
      });

      logger.info(
        { traceId, certificateId: certificate.id },
        'POST /training/modules/{moduleId}/certificates - Success',
      );
      return success(res, { data: certificate }, 201);
    } catch (e) {
      next(e);
    }
  }),
];

// ---------------------------------------------------------------------------
// GET /training/modules/:moduleId/certificates/:certificateId
// Description: Retrieve a single certificate
// Security:    MEMBER role required
// ---------------------------------------------------------------------------

export const getCertificate: RequestHandler[] = [
  validate({ params: CertificateParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    try {
      // Resolve association
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'GET /training/modules/{moduleId}/certificates/{certificateId} - Request started',
      );

      // Authorize: minimum MEMBER role
      await withRole(req, UserRole.MEMBER);

      logger.info(
        { traceId },
        'GET /training/modules/{moduleId}/certificates/{certificateId} - User authorized',
      );

      // Find certificate by filtering the module's certificate list
      const { moduleId, certificateId } = req.params;
      const certificates = await findManyCertificates({
        associationId: association.id,
        moduleId: moduleId as string,
      });

      const certificate = certificates.find((c) => c.id === certificateId);

      if (!certificate) throw new NotFoundError('Training certificate not found');

      logger.info(
        { traceId, certificateId },
        'GET /training/modules/{moduleId}/certificates/{certificateId} - Success',
      );
      return success(res, { data: certificate });
    } catch (e) {
      next(e);
    }
  }),
];

// ---------------------------------------------------------------------------
// PATCH /training/modules/:moduleId/certificates/:certificateId
// Description: Update a certificate (optionally replace file)
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const patchCertificate: RequestHandler[] = [
  validate({ params: CertificateParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    try {
      // Resolve association
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'PATCH /training/modules/{moduleId}/certificates/{certificateId} - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'PATCH /training/modules/{moduleId}/certificates/{certificateId} - User authorized',
      );

      // Parse request: optional file + required metadata JSON
      const { moduleId, certificateId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!metadataRaw) {
        throw new BadRequestError('Metadata is required');
      }

      // Validate metadata
      let metadata: z.infer<typeof UpdateTrainingCertificateSchema>;
      try {
        metadata = UpdateTrainingCertificateSchema.parse(JSON.parse(metadataRaw));
      } catch (error) {
        if (error instanceof SyntaxError) throw new BadRequestError('Invalid metadata JSON');
        throw error;
      }

      // Upload new file if provided
      let certificateUrl: string | undefined;
      let fileId: string | undefined;

      if (file) {
        if (!file.size || file.size === 0) {
          throw new BadRequestError('File is empty');
        }

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
            uploadedById: user.id,
          },
        });

        certificateUrl = uploadResult.url;
        fileId = fileRecord.id;
      }

      // Apply the update (old file cleanup happens in service)
      const { certificate, oldStorageKey } = await updateCertificate({
        associationId: association.id,
        moduleId: moduleId as string,
        certificateId: certificateId as string,
        actorId: user.id,
        data: metadata,
        certificateUrl,
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
        { traceId, certificateId },
        'PATCH /training/modules/{moduleId}/certificates/{certificateId} - Success',
      );
      return success(res, { data: certificate });
    } catch (e) {
      next(e);
    }
  }),
];

// ---------------------------------------------------------------------------
// DELETE /training/modules/:moduleId/certificates/:certificateId
// Description: Delete a certificate and its file
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const deleteCertificateHandler: RequestHandler[] = [
  validate({ params: CertificateParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    try {
      // Resolve association
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'DELETE /training/modules/{moduleId}/certificates/{certificateId} - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'DELETE /training/modules/{moduleId}/certificates/{certificateId} - User authorized',
      );

      // Delete the certificate (cascades to file record)
      const { moduleId, certificateId } = req.params;
      const result = await deleteCertificate({
        associationId: association.id,
        moduleId: moduleId as string,
        certificateId: certificateId as string,
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
        { traceId, certificateId },
        'DELETE /training/modules/{moduleId}/certificates/{certificateId} - Success',
      );
      return success(res, { data: { success: true, message: 'Training certificate deleted' } });
    } catch (e) {
      next(e);
    }
  }),
];

// ---------------------------------------------------------------------------
// POST /training/modules/:moduleId/certificate-template
// Description: Upload a certificate template
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const postCertificateTemplate: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    try {
      // Resolve association
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'POST /training/modules/{moduleId}/certificate-template - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'POST /training/modules/{moduleId}/certificate-template - User authorized',
      );

      // Parse request: file + optional name
      const { moduleId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file || !file.size) {
        throw new BadRequestError('File is required');
      }

      const name = (req.body.name as string) || 'Module Certificate';

      // Upload template file to Supabase storage
      const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
      const uploadResult = await uploadToBucket(
        webFile,
        `certificates/${association.slug}/${moduleId}/template`,
        traceId,
      );

      // Create a File record
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

      // Create/replace the certificate template
      const template = await createCertificateTemplate({
        associationId: association.id,
        moduleId: moduleId as string,
        actorId: user.id,
        name,
        certificateUrl: uploadResult.url,
        fileId: fileRecord.id,
      });

      logger.info(
        { traceId, templateId: template.id },
        'POST /training/modules/{moduleId}/certificate-template - Success',
      );
      return success(res, { data: template }, 201);
    } catch (e) {
      next(e);
    }
  }),
];

// ---------------------------------------------------------------------------
// DELETE /training/modules/:moduleId/certificate-template
// Description: Remove certificate template
// Security:    DPO role required
// ---------------------------------------------------------------------------

export const deleteCertificateTemplateRoute: RequestHandler[] = [
  validate({ params: ModuleParamsSchema }),

  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.traceId as string) || '';

    try {
      // Resolve association
      const association = await getAssociation(req);

      logger.info(
        { traceId, associationId: association.id },
        'DELETE /training/modules/{moduleId}/certificate-template - Request started',
      );

      // Authorize: DPO role required
      const user = await withRole(req, UserRole.DPO);

      logger.info(
        { traceId, userId: user.id },
        'DELETE /training/modules/{moduleId}/certificate-template - User authorized',
      );

      // Delete the template (old file cleanup happens in service)
      await deleteCertificateTemplate({
        associationId: association.id,
        moduleId: req.params.moduleId as string,
        actorId: user.id,
      });

      logger.info(
        { traceId },
        'DELETE /training/modules/{moduleId}/certificate-template - Success',
      );
      return success(res, { data: { success: true, message: 'Certificate template removed' } });
    } catch (e) {
      next(e);
    }
  }),
];
