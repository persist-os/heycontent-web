/*
  Warnings:

  - You are about to drop the column `error` on the `SocialUpdate` table. All the data in the column will be lost.
  - You are about to drop the column `processed` on the `SocialUpdate` table. All the data in the column will be lost.
  - Added the required column `updatedAt` to the `SocialUpdate` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `SocialUpdate` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SocialUpdate_platform_type_idx";

-- DropIndex
DROP INDEX "SocialUpdate_processed_idx";

-- AlterTable
ALTER TABLE "SocialUpdate" DROP COLUMN "error",
DROP COLUMN "processed",
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "SocialAccount" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "expiresAt" TIMESTAMP(3),
    "tokenType" TEXT,
    "scope" TEXT,
    "profileUrl" TEXT,
    "avatarUrl" TEXT,
    "metadata" JSONB,
    "isConnected" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SocialAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "proposedToId" TEXT,
    "suggestedToId" TEXT,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipRequirement" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "completed" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "PartnershipRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipEvent" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT,
    "description" TEXT,

    CONSTRAINT "PartnershipEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "role" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartnershipHistory" (
    "id" TEXT NOT NULL,
    "partnershipId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,

    CONSTRAINT "PartnershipHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SocialAccount_userId_platform_key" ON "SocialAccount"("userId", "platform");

-- CreateIndex
CREATE INDEX "Partnership_userId_idx" ON "Partnership"("userId");

-- CreateIndex
CREATE INDEX "Partnership_proposedToId_idx" ON "Partnership"("proposedToId");

-- CreateIndex
CREATE INDEX "Partnership_suggestedToId_idx" ON "Partnership"("suggestedToId");

-- CreateIndex
CREATE INDEX "SocialUpdate_userId_idx" ON "SocialUpdate"("userId");

-- AddForeignKey
ALTER TABLE "SocialUpdate" ADD CONSTRAINT "SocialUpdate_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SocialAccount" ADD CONSTRAINT "SocialAccount_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_proposedToId_fkey" FOREIGN KEY ("proposedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_suggestedToId_fkey" FOREIGN KEY ("suggestedToId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipRequirement" ADD CONSTRAINT "PartnershipRequirement_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipEvent" ADD CONSTRAINT "PartnershipEvent_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartnershipHistory" ADD CONSTRAINT "PartnershipHistory_partnershipId_fkey" FOREIGN KEY ("partnershipId") REFERENCES "Partnership"("id") ON DELETE CASCADE ON UPDATE CASCADE;
