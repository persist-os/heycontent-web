/*
  Warnings:

  - You are about to drop the column `metrics` on the `Partnership` table. All the data in the column will be lost.
  - You are about to drop the column `action` on the `PartnershipHistory` table. All the data in the column will be lost.
  - You are about to drop the column `details` on the `PartnershipHistory` table. All the data in the column will be lost.
  - You are about to drop the column `userId` on the `PartnershipHistory` table. All the data in the column will be lost.
  - Added the required column `event` to the `PartnershipHistory` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Partnership" DROP COLUMN "metrics",
ADD COLUMN     "potentialValue" DECIMAL(65,30),
ADD COLUMN     "receivedDate" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "PartnershipEvent" ALTER COLUMN "type" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PartnershipHistory" DROP COLUMN "action",
DROP COLUMN "details",
DROP COLUMN "userId",
ADD COLUMN     "event" TEXT NOT NULL;
