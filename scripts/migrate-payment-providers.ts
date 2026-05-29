import { prisma } from '@src/shared/lib/prisma';
import { encrypt } from '@src/shared/lib/crypto';
import { PaymentProviderType } from '@prisma/client';
import { env } from '@src/env';

async function migrate() {
  console.log('Starting payment provider migration...');

  const existing = await prisma.paymentProvider.count();
  if (existing > 0) {
    console.log(`Found ${existing} existing provider(s), skipping migration`);
    return;
  }

  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  const webhookSecret = env.RAZORPAY_WEBHOOK_SECRET;

  if (!keyId || !keySecret) {
    console.log('No global Razorpay credentials found in environment, skipping');
    return;
  }

  const associations = await prisma.association.findMany();
  console.log(`Found ${associations.length} association(s) to migrate`);

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
    console.log(`  ✓ Migrated provider for ${assoc.name} (${assoc.slug})`);
    migrated++;
  }

  console.log(`\nMigration complete: ${migrated} provider(s) created`);
  console.log('You can now make RAZORPAY_* env vars optional in env.ts');
}

migrate()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
