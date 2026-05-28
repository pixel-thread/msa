import { env } from "@src/env";
import { prisma } from "@lib/prisma";
import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  createCertificateTemplate,
  deleteCertificateTemplate,
} from "@feature/training/services";
import { uploadToBucket } from "@src/shared/lib/supabase/storage";
import { z } from "zod";
import { logger } from "@src/shared/logger";

const ParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

/**
 * POST /training/modules/[moduleId]/certificate-template
 *
 * Uploads a file and creates a TrainingCertificateTemplate linked to the module.
 * If a template already exists, it is replaced (old file cleaned up).
 *
 * Auth: DPO role or higher. Tenant-scoped by association.
 */
export const POST = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    logger.info("POST /training/modules/{moduleId}/certificate-template - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("POST /training/modules/{moduleId}/certificate-template - User authorized", { traceId, userId: user.id });

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      throw new BadRequestError("File is required");
    }

    const name = (formData.get("name") as string) || "Module Certificate";

    const uploadResult = await uploadToBucket(
      file,
      `certificates/${association.slug}/${moduleId}/template`,
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

    const template = await createCertificateTemplate({
      associationId: association.id,
      moduleId,
      actorId: user.id,
      name,
      certificateUrl: uploadResult.url,
      fileId: fileRecord.id,
    });

    logger.info("POST /training/modules/{moduleId}/certificate-template - Success", { traceId, templateId: template.id });
    return SuccessResponse({ data: template }, 201);
  },
);

/**
 * DELETE /training/modules/[moduleId]/certificate-template
 *
 * Removes the certificate template from the module and cleans up the File record.
 *
 * Auth: DPO role or higher. Tenant-scoped by association.
 */
export const DELETE = withAssociation(
  { params: ParamsSchema },
  async (association, { params, traceId }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    logger.info("DELETE /training/modules/{moduleId}/certificate-template - Request started", { traceId, associationId: association.id });

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);
    logger.info("DELETE /training/modules/{moduleId}/certificate-template - User authorized", { traceId, userId: user.id });

    await deleteCertificateTemplate({
      associationId: association.id,
      moduleId,
      actorId: user.id,
    });

    logger.info("DELETE /training/modules/{moduleId}/certificate-template - Success", { traceId, moduleId });
    return SuccessResponse({
      data: { success: true, message: "Certificate template removed" },
    });
  },
);
