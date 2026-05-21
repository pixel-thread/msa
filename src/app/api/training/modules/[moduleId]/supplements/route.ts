import { env } from "@src/env";
import { prisma } from "@lib/prisma";
import { withAssociation } from "@src/shared/api/with-association";
import { withRole } from "@src/shared/api/with-role";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import {
  findManySupplements,
  createSupplement,
} from "@feature/training/services";
import { CreateSupplementSchema } from "@feature/training/validators/training";
import {
  uploadToBucket,
  mimeToFileType,
} from "@src/shared/lib/supabase/storage";
import { z } from "zod";

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

    const supplements = await findManySupplements({
      associationId: association.id,
      moduleId,
    });

    return SuccessResponse({ data: supplements });
  },
);

export const POST = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    const { moduleId } = params;

    const user = await withRole(request, UserRole.DPO);

    const formData = await request.formData();

    const file = formData.get("file") as File | null;

    const metadataRaw = formData.get("metadata") as string | null;

    if (!file || !metadataRaw) {
      throw new BadRequestError("File and metadata are required");
    }

    let metadata: z.infer<typeof CreateSupplementSchema>;
    try {
      const parsed = JSON.parse(metadataRaw);
      metadata = CreateSupplementSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestError("Invalid metadata JSON");
      }
      throw error;
    }

    if (!file.size || file.size === 0) {
      throw new BadRequestError("File is empty");
    }

    const uploadResult = await uploadToBucket(
      file,
      `supplements/${association.slug}/${moduleId}`,
    );

    const fileRecord = await prisma.file.create({
      data: {
        associationId: association.id,
        originalName: file.name,
        storedName: uploadResult.storedName,
        mimeType: uploadResult.mimeType,
        extension: file.name.split(".").pop() || null,
        sizeBytes: uploadResult.sizeBytes,
        type: mimeToFileType(uploadResult.mimeType),
        bucket: env.SUPABASE_BUCKET,
        storageKey: uploadResult.storageKey,
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
