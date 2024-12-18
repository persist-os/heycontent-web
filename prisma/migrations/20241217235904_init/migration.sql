/*
  Warnings:

  - The `references` column on the `Note` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "auth";

-- AlterTable
ALTER TABLE "public"."Note" DROP COLUMN "references",
ADD COLUMN     "references" JSONB[];
