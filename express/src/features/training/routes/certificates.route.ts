import { Request, Response, NextFunction } from 'express';
import { validate } from '@src/shared/lib/validate';
import { success } from '@src/shared/utils/responses';
import { prisma } from '@src/shared/lib/prisma';
import { UserRole } from '@prisma/client';
import {
  findManyCertificates,
  createCertificate,
  updateCertificate,
  deleteCertificate,
  createCertificateTemplate,
  deleteCertificateTemplate,
} from '@src/features/training/services';
import {
  CreateTrainingCertificateSchema,
  UpdateTrainingCertificateSchema,
} from '@src/features/training/validators/training';
import { uploadToBucket, deleteFromBucket } from '@src/shared/lib/supabase/storage';
import { BadRequestError, NotFoundError } from '@src/shared/errors';
import { env } from '@src/env';
import { logger } from '@src/shared/logger';
import { getAssociation, withRole } from './_helpers';
import { z } from 'zod';

const ModuleParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
});

const CertificateParamsSchema = z.object({
  moduleId: z.string().uuid('Invalid module ID'),
  certificateId: z.string().uuid('Invalid certificate ID'),
});

export const getCertificates = [
  validate({ params: ModuleParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'GET /training/modules/{moduleId}/certificates - Request started');
      await withRole(req, UserRole.MEMBER);
      logger.info({ traceId }, 'GET /training/modules/{moduleId}/certificates - User authorized');

      const certificates = await findManyCertificates({ associationId: association.id, moduleId: req.params.moduleId });

      logger.info({ traceId }, 'GET /training/modules/{moduleId}/certificates - Success');
      return success(res, { data: certificates });
    } catch (e) { next(e); }
  },
];

export const postCertificate = [
  validate({ params: ModuleParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'POST /training/modules/{moduleId}/certificates - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id }, 'POST /training/modules/{moduleId}/certificates - User authorized');

      const { moduleId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!file || !metadataRaw) {
        throw new BadRequestError('File and metadata are required');
      }

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

      const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
      const uploadResult = await uploadToBucket(webFile, `certificates/${association.slug}/${moduleId}`, traceId);

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

      const certificate = await createCertificate({
        associationId: association.id,
        moduleId,
        actorId: user.id,
        data: metadata,
        certificateUrl: uploadResult.url,
        fileId: fileRecord.id,
      });

      logger.info({ traceId, certificateId: certificate.id }, 'POST /training/modules/{moduleId}/certificates - Success');
      return success(res, { data: certificate }, 201);
    } catch (e) { next(e); }
  },
];

export const getCertificate = [
  validate({ params: CertificateParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'GET /training/modules/{moduleId}/certificates/{certificateId} - Request started');
      await withRole(req, UserRole.MEMBER);
      logger.info({ traceId }, 'GET /training/modules/{moduleId}/certificates/{certificateId} - User authorized');

      const { moduleId, certificateId } = req.params;
      const certificates = await findManyCertificates({ associationId: association.id, moduleId });
      const certificate = certificates.find((c) => c.id === certificateId);

      if (!certificate) throw new NotFoundError('Training certificate not found');

      logger.info({ traceId, certificateId }, 'GET /training/modules/{moduleId}/certificates/{certificateId} - Success');
      return success(res, { data: certificate });
    } catch (e) { next(e); }
  },
];

export const patchCertificate = [
  validate({ params: CertificateParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'PATCH /training/modules/{moduleId}/certificates/{certificateId} - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id }, 'PATCH /training/modules/{moduleId}/certificates/{certificateId} - User authorized');

      const { moduleId, certificateId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      const metadataRaw = req.body.metadata as string | undefined;

      if (!metadataRaw) {
        throw new BadRequestError('Metadata is required');
      }

      let metadata: z.infer<typeof UpdateTrainingCertificateSchema>;
      try {
        metadata = UpdateTrainingCertificateSchema.parse(JSON.parse(metadataRaw));
      } catch (error) {
        if (error instanceof SyntaxError) throw new BadRequestError('Invalid metadata JSON');
        throw error;
      }

      let certificateUrl: string | undefined;
      let fileId: string | undefined;

      if (file) {
        if (!file.size || file.size === 0) {
          throw new BadRequestError('File is empty');
        }

        const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
        const uploadResult = await uploadToBucket(webFile, `certificates/${association.slug}/${moduleId}`, traceId);

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

      const { certificate, oldStorageKey } = await updateCertificate({
        associationId: association.id,
        moduleId,
        certificateId,
        actorId: user.id,
        data: metadata,
        certificateUrl,
        fileId,
      });

      if (oldStorageKey) {
        try { await deleteFromBucket(oldStorageKey); } catch { /* best-effort cleanup */ }
      }

      logger.info({ traceId, certificateId }, 'PATCH /training/modules/{moduleId}/certificates/{certificateId} - Success');
      return success(res, { data: certificate });
    } catch (e) { next(e); }
  },
];

export const deleteCertificateHandler = [
  validate({ params: CertificateParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'DELETE /training/modules/{moduleId}/certificates/{certificateId} - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id }, 'DELETE /training/modules/{moduleId}/certificates/{certificateId} - User authorized');

      const { moduleId, certificateId } = req.params;
      const result = await deleteCertificate({
        associationId: association.id,
        moduleId,
        certificateId,
        actorId: user.id,
      });

      if (result.storageKey) {
        try { await deleteFromBucket(result.storageKey); } catch { /* best-effort cleanup */ }
      }

      logger.info({ traceId, certificateId }, 'DELETE /training/modules/{moduleId}/certificates/{certificateId} - Success');
      return success(res, { data: { success: true, message: 'Training certificate deleted' } });
    } catch (e) { next(e); }
  },
];

export const postCertificateTemplate = [
  validate({ params: ModuleParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'POST /training/modules/{moduleId}/certificate-template - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id }, 'POST /training/modules/{moduleId}/certificate-template - User authorized');

      const { moduleId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;

      if (!file || !file.size) {
        throw new BadRequestError('File is required');
      }

      const name = (req.body.name as string) || 'Module Certificate';

      const webFile = new File([file.buffer], file.originalname, { type: file.mimetype });
      const uploadResult = await uploadToBucket(webFile, `certificates/${association.slug}/${moduleId}/template`, traceId);

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

      const template = await createCertificateTemplate({
        associationId: association.id,
        moduleId,
        actorId: user.id,
        name,
        certificateUrl: uploadResult.url,
        fileId: fileRecord.id,
      });

      logger.info({ traceId, templateId: template.id }, 'POST /training/modules/{moduleId}/certificate-template - Success');
      return success(res, { data: template }, 201);
    } catch (e) { next(e); }
  },
];

export const deleteCertificateTemplate = [
  validate({ params: ModuleParamsSchema }),
  async (req: Request, res: Response, next: NextFunction) => {
    const traceId = (req.headers['x-trace-id'] as string) || '';
    try {
      const association = await getAssociation(req);
      logger.info({ traceId, associationId: association.id }, 'DELETE /training/modules/{moduleId}/certificate-template - Request started');
      const user = await withRole(req, UserRole.DPO);
      logger.info({ traceId, userId: user.id }, 'DELETE /training/modules/{moduleId}/certificate-template - User authorized');

      await deleteCertificateTemplate({
        associationId: association.id,
        moduleId: req.params.moduleId,
        actorId: user.id,
      });

      logger.info({ traceId }, 'DELETE /training/modules/{moduleId}/certificate-template - Success');
      return success(res, { data: { success: true, message: 'Certificate template removed' } });
    } catch (e) { next(e); }
  },
];
