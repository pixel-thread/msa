import { env } from "@src/env";
import { prisma } from "@lib/prisma";
import {
  withAssociation,
  withRole,
  withAssociationFormData,
  zjson,
} from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findManySupplements,
  createSupplement,
} from "@feature/training/services";
import { CreateSupplementSchema } from "@feature/training/validators/training";
import { uploadToBucket } from "@src/shared/lib/supabase/storage";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

const SupplementFormSchema = z.object({
  file: z
    .instanceof(File, { message: "File is required" })
    .refine((f) => f.size > 0, "File is empty"),
  metadata: zjson(CreateSupplementSchema),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    await withRole(request, UserRole.MEMBER);

    const { moduleId } = params;

    const supplements = await findManySupplements({
      associationId: association.id,
      moduleId,
    });

    return SuccessResponse({ data: supplements });
  },
);

export const POST = withAssociationFormData(
  {
    params: TrainingParamsSchema,
    formData: SupplementFormSchema,
  },
  async (association, { formData, params }, request) => {
    const { moduleId } = params!;

    const user = await withRole(request, UserRole.DPO);

    const { file, metadata } = formData;

    const uploadResult = await uploadToBucket(
      file,
      `supplements/${association.slug}/${moduleId}`,
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

    const supplement = await createSupplement({
      associationId: association.id,
      moduleId,
      actorId: user.id,
      data: metadata,
      downloadUrl: uploadResult.url,
      fileId: fileRecord.id,
    });

    return SuccessResponse({ data: supplement }, 201);
  },
);
