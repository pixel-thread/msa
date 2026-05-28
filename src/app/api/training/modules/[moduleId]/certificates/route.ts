import { env } from "@src/env";
import { prisma } from "@lib/prisma";
import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findManyCertificates,
  createCertificate,
} from "@feature/training/services";
import { CreateTrainingCertificateSchema } from "@feature/training/validators/training";
import { uploadToBucket } from "@src/shared/lib/supabase/storage";
import { z } from "zod";
import { getTraceId } from "@src/shared/utils";
import { logger } from "@src/shared/logger";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    await withRole(request, UserRole.MEMBER);

    const { moduleId } = params;

    const certificates = await findManyCertificates({
      associationId: association.id,
      moduleId,
    });

    return SuccessResponse({ data: certificates });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }
    const traceId = getTraceId(request);

    const { moduleId } = params;

    const user = await withRole(request, UserRole.DPO);

    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    const metadataRaw = formData.get("metadata") as string | null;

    if (!file || !metadataRaw) {
      throw new BadRequestError("File and metadata are required");
    }

    let metadata: z.infer<typeof CreateTrainingCertificateSchema>;
    logger.info("Start Parsing metadata", { traceId });
    try {
      const parsed = JSON.parse(metadataRaw);
      metadata = CreateTrainingCertificateSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestError("Invalid metadata JSON");
      }
      throw error;
    }
    logger.info("End Parsing metadata", { traceId });

    if (!file.size || file.size === 0) {
      throw new BadRequestError("File is empty");
    }

    logger.info("Start uploading file", { traceId });
    const uploadResult = await uploadToBucket(
      file,
      `certificates/${association.slug}/${moduleId}`,
    );

    logger.info("End uploading file", { traceId });
    logger.info("Start creating file record", {
      traceId,
      storeName: uploadResult.key,
    });
    const fileRecord = await prisma.file.create({
      data: {
        associationId: association.id,
        originalName: file.name,
        storedName: uploadResult.key || "",
        mimeType: uploadResult.mimeType,
        extension: file.name.split(".").pop() || null,
        sizeBytes: uploadResult.sizeBytes,
        bucket: env.STORAGE_BUCKET,
        storageKey: uploadResult.key,
        url: uploadResult.url,
        uploadedById: user.id,
      },
    });

    logger.info("end creating file record", { traceId });
    logger.info("Start creating certificate record", { traceId });
    const certificate = await createCertificate({
      associationId: association.id,
      moduleId,
      actorId: user.id,
      data: metadata,
      certificateUrl: uploadResult.url,
      fileId: fileRecord.id,
    });

    logger.info("Start creating certificate record", { traceId });
    return SuccessResponse({ data: certificate }, 201);
  },
);
