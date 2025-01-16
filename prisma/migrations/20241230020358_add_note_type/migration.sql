/*
  Warnings:

  - You are about to drop the column `isActive` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `lastContact` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `Contact` table. All the data in the column will be lost.
  - You are about to drop the column `duration` on the `PartnershipEvent` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `PartnershipEvent` table. All the data in the column will be lost.
  - You are about to drop the column `outcome` on the `PartnershipEvent` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `PartnershipHistory` table. All the data in the column will be lost.
  - You are about to drop the column `completedAt` on the `PartnershipRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `PartnershipRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `dueDate` on the `PartnershipRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `PartnershipRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `platform` on the `PartnershipRequirement` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `PartnershipRequirement` table. All the data in the column will be lost.
  - You are about to drop the `PartnershipCommunication` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `PartnershipTask` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `description` on table `Partnership` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "PartnershipCommunication" DROP CONSTRAINT "PartnershipCommunication_contactId_fkey";

-- DropForeignKey
ALTER TABLE "PartnershipCommunication" DROP CONSTRAINT "PartnershipCommunication_partnershipId_fkey";

-- DropForeignKey
ALTER TABLE "PartnershipTask" DROP CONSTRAINT "PartnershipTask_partnershipId_fkey";

-- DropIndex
DROP INDEX "Contact_email_idx";

-- DropIndex
DROP INDEX "Contact_partnershipId_idx";

-- DropIndex
DROP INDEX "Partnership_alignmentScore_idx";

-- DropIndex
DROP INDEX "Partnership_brand_idx";

-- DropIndex
DROP INDEX "Partnership_confidence_idx";

-- DropIndex
DROP INDEX "Partnership_status_idx";

-- DropIndex
DROP INDEX "PartnershipEvent_date_idx";

-- DropIndex
DROP INDEX "PartnershipEvent_partnershipId_idx";

-- DropIndex
DROP INDEX "PartnershipHistory_date_idx";

-- DropIndex
DROP INDEX "PartnershipHistory_partnershipId_idx";

-- DropIndex
DROP INDEX "PartnershipRequirement_partnershipId_idx";

-- AlterTable
ALTER TABLE "Contact" DROP COLUMN "isActive",
DROP COLUMN "lastContact",
DROP COLUMN "notes",
DROP COLUMN "platform";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "type" TEXT DEFAULT 'default';

-- AlterTable
ALTER TABLE "Partnership" ALTER COLUMN "brand" SET DEFAULT '',
ALTER COLUMN "type" SET DEFAULT 'email',
ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "description" SET DEFAULT '';

-- AlterTable
ALTER TABLE "PartnershipEvent" DROP COLUMN "duration",
DROP COLUMN "location",
DROP COLUMN "outcome";

-- AlterTable
ALTER TABLE "PartnershipHistory" DROP COLUMN "metadata",
ADD COLUMN     "details" TEXT;

-- AlterTable
ALTER TABLE "PartnershipRequirement" DROP COLUMN "completedAt",
DROP COLUMN "description",
DROP COLUMN "dueDate",
DROP COLUMN "notes",
DROP COLUMN "platform",
DROP COLUMN "quantity";

-- AlterTable
ALTER TABLE "rag_documents" ADD COLUMN     "embedding" JSONB;

-- DropTable
DROP TABLE "PartnershipCommunication";

-- DropTable
DROP TABLE "PartnershipTask";
