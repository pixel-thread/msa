import 'server-only';
import { prisma } from '@src/shared/lib/prisma';
import { encrypt } from '@src/shared/lib/crypto';
import { PaymentProviderType } from '@prisma/client';
import { NotFoundError } from '@src/shared/errors';
import { env } from '@src/env';

export interface UpsertProviderInput {
  id: string;
  associationId: string;
  provider: PaymentProviderType;
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  isActive?: boolean;
}

export interface CreateProviderInput {
  associationId: string;
  provider: PaymentProviderType;
  keyId: string;
  keySecret: string;
  webhookSecret?: string;
  isActive?: boolean;
}

export interface UpdateProviderInput {
  keyId?: string;
  keySecret?: string;
  webhookSecret?: string;
  isActive?: boolean;
}

export interface ProviderResponse {
  id: string;
  associationId: string;
  provider: string;
  keyId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function maskProvider(provider: any): ProviderResponse {
  return {
    id: provider.id,
    associationId: provider.associationId,
    provider: provider.provider,
    keyId: provider.keyId,
    isActive: provider.isActive,
    createdAt: provider.createdAt,
    updatedAt: provider.updatedAt,
  };
}

export async function createProvider(input: CreateProviderInput): Promise<ProviderResponse> {
  const encryptedKeySecret = encrypt(input.keySecret);

  const encryptedWebhookSecret = input.webhookSecret ? encrypt(input.webhookSecret) : null;

  const provider = await prisma.paymentProvider.create({
    data: {
      associationId: input.associationId,
      provider: input.provider,
      keyId: input.keyId,
      encryptedKeySecret,
      encryptedWebhookSecret,
      isActive: input.isActive ?? true,
    },
  });

  return maskProvider(provider);
}
export async function upsertProvider(input: UpsertProviderInput): Promise<ProviderResponse> {
  const encryptedKeySecret = encrypt(input.keySecret);

  const encryptedWebhookSecret = input.webhookSecret ? encrypt(input.webhookSecret) : null;

  const provider = await prisma.paymentProvider.upsert({
    where: {
      id: input.id,
      provider: input.provider,
      associationId: input.associationId,
    },
    create: {
      associationId: input.associationId,
      provider: input.provider,
      keyId: input.keyId,
      encryptedKeySecret,
      encryptedWebhookSecret,
      isActive: input.isActive ?? true,
    },
    update: {
      keyId: input.keyId,
      encryptedKeySecret,
      encryptedWebhookSecret,
      isActive: input.isActive ?? true,
    },
  });

  return maskProvider(provider);
}

export async function getProviderById(
  providerId: string,
  associationId: string,
): Promise<ProviderResponse | null> {
  const provider = await prisma.paymentProvider.findFirst({
    where: {
      id: providerId,
      associationId,
    },
  });

  if (!provider) return null;
  return maskProvider(provider);
}

export async function getProvidersByAssociation(
  associationId: string,
): Promise<ProviderResponse[]> {
  const providers = await prisma.paymentProvider.findMany({
    where: { associationId },
    orderBy: { createdAt: 'desc' },
  });

  return providers.map(maskProvider);
}

export async function getActiveProvider(associationId: string, providerType?: PaymentProviderType) {
  const where: Record<string, unknown> = {
    associationId,
    isActive: true,
  };

  if (providerType) {
    where.provider = providerType;
  }

  const provider = await prisma.paymentProvider.findFirst({ where });
  return provider;
}

export async function setActiveProvider(
  providerId: string,
  associationId: string,
): Promise<ProviderResponse> {
  const provider = await prisma.paymentProvider.findFirst({
    where: { id: providerId, associationId },
  });

  if (!provider) {
    throw new NotFoundError('Provider not found');
  }

  await prisma.paymentProvider.updateMany({
    where: {
      associationId,
      provider: provider.provider,
      id: { not: providerId },
    },
    data: { isActive: false },
  });

  await prisma.paymentProvider.updateMany({
    where: {
      associationId,
      id: { not: providerId },
    },
    data: { isActive: false },
  });

  const updated = await prisma.paymentProvider.update({
    where: { id: providerId },
    data: { isActive: provider.isActive ? false : true },
  });

  return maskProvider(updated);
}

export async function updateProvider(
  providerId: string,
  associationId: string,
  input: UpdateProviderInput,
): Promise<ProviderResponse> {
  const provider = await prisma.paymentProvider.findFirst({
    where: { id: providerId, associationId },
  });

  if (!provider) {
    throw new NotFoundError('Provider not found');
  }

  const updateData: Record<string, unknown> = {};

  if (input.keyId !== undefined) {
    updateData.keyId = input.keyId;
  }

  if (input.keySecret !== undefined) {
    updateData.encryptedKeySecret = encrypt(input.keySecret);
  }

  if (input.webhookSecret !== undefined) {
    updateData.encryptedWebhookSecret = input.webhookSecret ? encrypt(input.webhookSecret) : null;
  }

  if (input.isActive !== undefined) {
    updateData.isActive = input.isActive;
  }

  const updated = await prisma.paymentProvider.update({
    where: { id: providerId },
    data: updateData,
  });

  return maskProvider(updated);
}

export async function deleteProvider(providerId: string, associationId: string): Promise<void> {
  console.log(providerId, associationId);
  const provider = await prisma.paymentProvider.findUnique({
    where: { id: providerId, associationId },
  });

  if (!provider) {
    throw new NotFoundError('Provider not found');
  }

  await prisma.paymentProvider.delete({
    where: { id: providerId },
  });
}

export async function migrateFromEnv(): Promise<number> {
  const existing = await prisma.paymentProvider.count();
  if (existing > 0) {
    console.log('Providers already exist, skipping migration');
    return 0;
  }

  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  if (!keyId || !keySecret) {
    console.log('No global credentials to migrate');
    return 0;
  }

  const associations = await prisma.association.findMany();
  let migrated = 0;

  for (const assoc of associations) {
    await prisma.paymentProvider.create({
      data: {
        associationId: assoc.id,
        provider: PaymentProviderType.RAZORPAY,
        keyId,
        encryptedKeySecret: encrypt(keySecret),
        encryptedWebhookSecret: webhookSecret ? encrypt(webhookSecret) : null,
        isActive: true,
      },
    });
    console.log(`Migrated provider for ${assoc.name}`);
    migrated++;
  }

  return migrated;
}
