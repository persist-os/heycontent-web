/*
  Warnings:

  - You are about to drop the `Analytics` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `ContentPost` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Partnership` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SocialAccount` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Analytics" DROP CONSTRAINT "Analytics_accountId_fkey";

-- DropForeignKey
ALTER TABLE "ContentPost" DROP CONSTRAINT "ContentPost_userId_fkey";

-- DropForeignKey
ALTER TABLE "Partnership" DROP CONSTRAINT "Partnership_accountId_fkey";

-- DropForeignKey
ALTER TABLE "SocialAccount" DROP CONSTRAINT "SocialAccount_userId_fkey";

-- DropTable
DROP TABLE "Analytics";

-- DropTable
DROP TABLE "ContentPost";

-- DropTable
DROP TABLE "Partnership";

-- DropTable
DROP TABLE "SocialAccount";

-- CreateTable
CREATE TABLE "SocialUpdate" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "platform" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "error" TEXT,

    CONSTRAINT "SocialUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SocialUpdate_platform_type_idx" ON "SocialUpdate"("platform", "type");

-- CreateIndex
CREATE INDEX "SocialUpdate_processed_idx" ON "SocialUpdate"("processed");
