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
  findManySupplements,
  updateSupplement,
  deleteSupplement,
} from "@feature/training/services";
import { UpdateSupplementSchema } from "@feature/training/validators/training";
import {
  uploadToBucket,
  deleteFromBucket,
} from "@src/shared/lib/supabase/storage";
import { z } from "zod";

const TrainingParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
  supplementId: z.uuid("Invalid supplement ID"),
});

export const GET = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }
    await withRole(request, UserRole.MEMBER);
    const { moduleId, supplementId } = params;

    const supplements = await findManySupplements({
      associationId: association.id,
      moduleId,
    });

    const supplement = supplements.find((s) => s.id === supplementId);

    if (!supplement) {
      throw new NotFoundError("Training supplement not found");
    }

    return SuccessResponse({ data: supplement });
  },
);

export const PATCH = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }

    const { moduleId, supplementId } = params;
    const user = await withRole(request, UserRole.DPO);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const metadataRaw = formData.get("metadata") as string | null;

    if (!metadataRaw) {
      throw new BadRequestError("Metadata is required");
    }

    let metadata: z.infer<typeof UpdateSupplementSchema>;
    try {
      const parsed = JSON.parse(metadataRaw);
      metadata = UpdateSupplementSchema.parse(parsed);
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new BadRequestError("Invalid metadata JSON");
      }
      throw error;
    }

    let downloadUrl: string | undefined;
    let fileId: string | undefined;

    if (file) {
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
        // Best-effort cleanup — file is orphaned in bucket but DB record is already updated
      }
    }

    return SuccessResponse({ data: supplement });
  },
);

export const DELETE = withAssociation(
  { params: TrainingParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid params");
    }
    const { moduleId, supplementId } = params;
    const user = await withRole(request, UserRole.DPO);

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
        // Best-effort cleanup — file is orphaned in bucket but DB records are already cleaned
      }
    }

    return SuccessResponse({
      data: { success: true, message: "Training supplement deleted" },
    });
  },
);
