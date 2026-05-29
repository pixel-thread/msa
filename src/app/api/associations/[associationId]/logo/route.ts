import { prisma } from '@lib/prisma';
import { withAssociationFormData, withRole } from '@src/shared/api';
import { SuccessResponse } from '@utils/responses';
import { NotFoundError } from '@src/shared/errors';
import { UserRole } from '@prisma/client';
import { uploadToBucket } from '@src/shared/lib/supabase/storage';
import { z } from 'zod';
import { logger } from '@src/shared/logger/server';

const ParamsSchema = z.object({
  associationId: z.string().uuid(),
});

const LogoFormSchema = z.object({
  logo: z
    .instanceof(File, { message: 'Logo file is required' })
    .refine((f) => f.size > 0, 'File is empty')
    .refine(
      (f) => ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml'].includes(f.type),
      'Logo must be a PNG, JPEG, WebP, or SVG image',
    ),
});

export const POST = withAssociationFormData(
  {
    params: ParamsSchema,
    formData: LogoFormSchema,
  },
  async (association, { formData, traceId }, request) => {
    logger.info(
      { traceId, associationId: association.id },
      'POST /api/associations/[associationId]/logo - Request started',
    );

    const user = await withRole(request, UserRole.SUPER_ADMIN);
    logger.info(
      { traceId, userId: user.id },
      'POST /api/associations/[associationId]/logo - User authorized',
    );

    const existing = await prisma.association.findUnique({
      where: { id: association.id },
    });

    if (!existing) {
      logger.error(
        { traceId, associationId: association.id },
        'POST /api/associations/[associationId]/logo - Association not found',
      );
      throw new NotFoundError('Association not found');
    }

    const uploadResult = await uploadToBucket(
      formData.logo,
      `associations/logos/${association.slug}`,
      traceId,
    );

    await prisma.association.update({
      where: { id: association.id },
      data: { logo: uploadResult.url },
    });

    logger.info(
      { traceId, associationId: association.id },
      'POST /api/associations/[associationId]/logo - Success',
    );

    return SuccessResponse(
      {
        data: {
          key: uploadResult.key,
          url: uploadResult.url,
        },
        message: 'Logo uploaded successfully',
      },
      201,
    );
  },
);
