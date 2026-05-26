import { env } from "@src/env";
import { prisma } from "@lib/prisma";
import { withAssociation, withRole } from "@src/shared/api";
import { SuccessResponse } from "@utils/responses";
import { ForbiddenError, BadRequestError } from "@src/shared/errors";
import { UserRole } from "@prisma/client";
import { uploadToBucket, deleteFromBucket } from "@src/shared/lib/supabase/storage";
import { z } from "zod";

const ParamsSchema = z.object({
  moduleId: z.uuid("Invalid module ID"),
});

export const POST = withAssociation(
  { params: ParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    const { moduleId } = params;
    const user = await withRole(request, UserRole.DPO);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.size) {
      throw new BadRequestError("File is required");
    }

    // Fetch current module to clean up old file
    const current = await prisma.trainingModule.findUnique({
      where: { id: moduleId, associationId: association.id },
      include: { globalCertificate: true },
    });

    if (!current) {
      throw new BadRequestError("Training module not found");
    }

    const oldStorageKey = current.globalCertificate?.storageKey;
    const oldFileId = current.globalCertificateFileId;

    const uploadResult = await uploadToBucket(
      file,
      `certificates/${association.slug}/${moduleId}/global`,
    );

    const fileRecord = await prisma.file.create({
      data: {
        associationId: association.id,
        originalName: file.name,
        storedName: uploadResult.storedName,
        mimeType: uploadResult.mimeType,
        extension: file.name.split(".").pop() || null,
        sizeBytes: uploadResult.sizeBytes,
        bucket: env.SUPABASE_BUCKET,
        storageKey: uploadResult.storageKey,
        url: uploadResult.url,
        uploadedById: user.id,
      },
    });

    const updated = await prisma.trainingModule.update({
      where: { id: moduleId },
      data: {
        globalCertificateUrl: uploadResult.url,
        globalCertificateFileId: fileRecord.id,
      },
    });

    // Clean up old file
    if (oldFileId) {
      await prisma.file.delete({ where: { id: oldFileId } }).catch(() => {});
    }
    if (oldStorageKey) {
      await deleteFromBucket(oldStorageKey).catch(() => {});
    }

    return SuccessResponse({ data: updated }, 201);
  },
);

export const DELETE = withAssociation(
  { params: ParamsSchema },
  async (association, { params }, request) => {
    if (!params) {
      throw new ForbiddenError("Invalid module ID");
    }

    const { moduleId } = params;
    await withRole(request, UserRole.DPO);

    const current = await prisma.trainingModule.findUnique({
      where: { id: moduleId, associationId: association.id },
      include: { globalCertificate: true },
    });

    if (!current) {
      throw new BadRequestError("Training module not found");
    }

    const oldStorageKey = current.globalCertificate?.storageKey;
    const oldFileId = current.globalCertificateFileId;

    await prisma.trainingModule.update({
      where: { id: moduleId },
      data: {
        globalCertificateUrl: null,
        globalCertificateFileId: null,
      },
    });

    if (oldFileId) {
      await prisma.file.delete({ where: { id: oldFileId } }).catch(() => {});
    }
    if (oldStorageKey) {
      await deleteFromBucket(oldStorageKey).catch(() => {});
    }

    return SuccessResponse({
      data: { success: true, message: "Global certificate removed" },
    });
  },
);
