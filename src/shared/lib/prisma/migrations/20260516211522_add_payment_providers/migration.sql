-- CreateEnum
CREATE TYPE "payment_provider_type" AS ENUM ('RAZORPAY', 'STRIPE', 'PAYU', 'CASHFREE');

-- CreateTable
CREATE TABLE "payment_providers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "associationId" UUID NOT NULL,
    "provider" "payment_provider_type" NOT NULL,
    "keyId" TEXT NOT NULL,
    "encryptedKeySecret" TEXT NOT NULL,
    "encryptedWebhookSecret" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_providers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "payment_providers_associationId_provider_key" ON "payment_providers"("associationId", "provider");

-- CreateIndex
CREATE INDEX "payment_providers_associationId_idx" ON "payment_providers"("associationId");

-- CreateIndex
CREATE INDEX "payment_providers_associationId_isActive_idx" ON "payment_providers"("associationId", "isActive");

-- AddForeignKey
ALTER TABLE "payment_providers" ADD CONSTRAINT "payment_providers_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
