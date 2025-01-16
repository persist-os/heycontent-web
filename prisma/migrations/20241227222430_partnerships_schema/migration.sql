/*
  Warnings:

  - Added the required column `brand` to the `Partnership` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Partnership` table without a default value. This is not possible if the table is not empty.
  - Made the column `type` on table `PartnershipEvent` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Contact" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "lastContact" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "platform" TEXT;

-- AlterTable
ALTER TABLE "Partnership" ADD COLUMN     "alignmentScore" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "brand" TEXT NOT NULL,
ADD COLUMN     "confidence" DOUBLE PRECISION,
ADD COLUMN     "deadline" TIMESTAMP(3),
ADD COLUMN     "estimatedValue" DECIMAL(65,30),
ADD COLUMN     "lastContact" TIMESTAMP(3),
ADD COLUMN     "metrics" JSONB,
ADD COLUMN     "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "signals" JSONB,
ADD COLUMN     "type" TEXT NOT NULL,
ADD COLUMN     "value" DECIMAL(65,30);

-- AlterTable
ALTER TABLE "PartnershipEvent" ADD COLUMN     "duration" INTEGER,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "outcome" TEXT,
ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "PartnershipHistory" ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "PartnershipRequirement" ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "dueDate" TIMESTAMP(3),
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "platform" TEXT,
ADD COLUMN     "quantity" INTEGER;

-- CreateTable
CREATE TABLE "PartnershipCommunication" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "contactId" TEXT,
    "type" TEXT NOT NULL,
    "subject" TEXT,
    "content" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "PartnershipCommunication_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipTask" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "dueDate" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedTo" TEXT,

    CONSTRAINT "PartnershipTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cache" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rag_documents" (
    "id" BIGSERIAL NOT NULL,
    "content" TEXT,
    "metadata" JSONB,

    CONSTRAINT "rag_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartnershipCommunication_partnershipId_idx" ON "PartnershipCommunication"("partnershipId");

-- CreateIndex
CREATE INDEX "PartnershipCommunication_contactId_idx" ON "PartnershipCommunication"("contactId");

-- CreateIndex
CREATE INDEX "PartnershipCommunication_timestamp_idx" ON "PartnershipCommunication"("timestamp");

-- CreateIndex
CREATE INDEX "PartnershipTask_partnershipId_idx" ON "PartnershipTask"("partnershipId");

-- CreateIndex
CREATE INDEX "PartnershipTask_status_idx" ON "PartnershipTask"("status");

-- CreateIndex
CREATE INDEX "PartnershipTask_dueDate_idx" ON "PartnershipTask"("dueDate");

-- CreateIndex
CREATE INDEX "Cache_key_createdAt_idx" ON "Cache"("key", "createdAt");

-- CreateIndex
CREATE INDEX "Cache_userId_idx" ON "Cache"("userId");

-- CreateIndex
CREATE INDEX "Contact_partnershipId_idx" ON "Contact"("partnershipId");

-- CreateIndex
CREATE INDEX "Contact_email_idx" ON "Contact"("email");

-- CreateIndex
CREATE INDEX "Partnership_status_idx" ON "Partnership"("status");

-- CreateIndex
CREATE INDEX "Partnership_brand_idx" ON "Partnership"("brand");

-- CreateIndex
CREATE INDEX "PartnershipEvent_partnershipId_idx" ON "PartnershipEvent"("partnershipId");

-- CreateIndex
CREATE INDEX "PartnershipEvent_date_idx" ON "PartnershipEvent"("date");

-- CreateIndex
CREATE INDEX "PartnershipHistory_partnershipId_idx" ON "PartnershipHistory"("partnershipId");

-- CreateIndex
CREATE INDEX "PartnershipHistory_date_idx" ON "PartnershipHistory"("date");

-- CreateIndex
CREATE INDEX "PartnershipRequirement_partnershipId_idx" ON "PartnershipRequirement"("partnershipId");

-- AddForeignKey
ALTER TABLE "PartnershipCommunication" ADD CONSTRAINT "PartnershipCommunication_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipCommunication" ADD CONSTRAINT "PartnershipCommunication_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipTask" ADD CONSTRAINT "PartnershipTask_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cache" ADD CONSTRAINT "Cache_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
