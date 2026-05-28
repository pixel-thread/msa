import { env } from "@src/env";
import { prisma } from "@lib/prisma";
import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
} from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findManyCertificates,
  updateCertificate,
  deleteCertificate,
} from "@feature/training/services";
import { UpdateTrainingCertificateSchema } from "@feature/training/validators/training";
import {
  uploadToBucket,
  deleteFromBucket,
} from "@src/shared/lib/supabase/storage";
import { z } from "zod";
import { logger } from "@src/shared/logger";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
  certificateId: z.uuid("Invalid certificate ID"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }

    logger.info("GET /training/modules/{moduleId}/certificates/{certificateId} - Request started", { traceId, associationId: association.id });

    await withRole(request, UserRole.MEMBER);
    logger.info("GET /training/modules/{moduleId}/certificates/{certificateId} - User authorized", { traceId });

    const { moduleId, certificateId } = params;

    const certificates = await findManyCertificates({
      associationId: association.id,
      moduleId,
    });

    const certificate = certificates.find((c) => c.id === certificateId);

    if (!certificate) {
      throw new NotFoundError("Training certificate not found");
    }

    logger.info("GET /training/modules/{moduleId}/certificates/{certificateId} - Success", { traceId, certificateId });
    return SuccessResponse({ data: certificate });
  },
);

export const PATCH = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }

    logger.info("PATCH /training/modules/{moduleId}/certificates/{certificateId} - Request started", { traceId, associationId: association.id });

    const { moduleId, certificateId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("PATCH /training/modules/{moduleId}/certificates/{certificateId} - User authorized", { traceId, userId: user.id });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataRaw = formData.get("metadata") as string | null;

    if (!metadataRaw) {
      throw new BadRequestError("Metadata is required");
    }

    let metadata: z.infer<typeof UpdateTrainingCertificateSchema>;
    try {
      const parsed = JSON.parse(metadataRaw);
      metadata = UpdateTrainingCertificateSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestError("Invalid metadata JSON");
      }
      throw error;
    }

    let certificateUrl: string | undefined;
    let fileId: string | undefined;

    if (file) {
      if (!file.size || file.size === 0) {
        throw new BadRequestError("File is empty");
      }

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
          extension: file.name.split(".").pop() || null,
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
      try {
        await deleteFromBucket(oldStorageKey);
      } catch {
        // Best-effort cleanup
      }
    }

    logger.info("PATCH /training/modules/{moduleId}/certificates/{certificateId} - Success", { traceId, certificateId });
    return SuccessResponse({ data: certificate });
  },
);

export const DELETE = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }

    logger.info("DELETE /training/modules/{moduleId}/certificates/{certificateId} - Request started", { traceId, associationId: association.id });

    const { moduleId, certificateId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("DELETE /training/modules/{moduleId}/certificates/{certificateId} - User authorized", { traceId, userId: user.id });

    const result = await deleteCertificate({
      associationId: association.id,
      moduleId,
      certificateId,
      actorId: user.id,
    });

    if (result.storageKey) {
      try {
        await deleteFromBucket(result.storageKey);
      } catch {
        // Best-effort cleanup
      }
    }

    logger.info("DELETE /training/modules/{moduleId}/certificates/{certificateId} - Success", { traceId, certificateId });
    return SuccessResponse({
      data: { success: true, message: "Training certificate deleted" },
    });
  },
);
