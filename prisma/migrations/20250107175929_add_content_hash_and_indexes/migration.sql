/*
  Warnings:

  - A unique constraint covering the columns `[content_hash]` on the table `rag_documents` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `content_hash` to the `rag_documents` table without a default value. This is not possible if the table is not empty.
  - Made the column `content` on table `rag_documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `metadata` on table `rag_documents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `embedding` on table `rag_documents` required. This step will fail if there are existing NULL values in that column.

*/
-- First, add the column as nullable
ALTER TABLE "rag_documents" ADD COLUMN "content_hash" TEXT;

-- Generate content hashes for existing records
UPDATE "rag_documents"
SET "content_hash" = encode(sha256(content::bytea), 'hex')
WHERE "content_hash" IS NULL;

-- Create a temporary table to store the latest version of each duplicate
CREATE TEMP TABLE latest_versions AS
SELECT DISTINCT ON (content_hash)
    id,
    content_hash,
    updated_at
FROM "rag_documents"
WHERE content_hash IN (
    SELECT content_hash
    FROM "rag_documents"
    GROUP BY content_hash
    HAVING COUNT(*) > 1
)
ORDER BY content_hash, updated_at DESC;

-- Delete duplicates keeping only the latest version
DELETE FROM "rag_documents"
WHERE content_hash IN (
    SELECT content_hash
    FROM latest_versions
)
AND id NOT IN (
    SELECT id
    FROM latest_versions
);

-- Make the column required and unique
ALTER TABLE "rag_documents" ALTER COLUMN "content_hash" SET NOT NULL;
CREATE UNIQUE INDEX "rag_documents_content_hash_key" ON "rag_documents"("content_hash");

-- Add the metadata index
CREATE INDEX "rag_documents_metadata_idx" ON "rag_documents" USING gin ("metadata");

-- Make other columns non-nullable
ALTER TABLE "rag_documents" ALTER COLUMN "content" SET NOT NULL;
ALTER TABLE "rag_documents" ALTER COLUMN "metadata" SET NOT NULL;
ALTER TABLE "rag_documents" ALTER COLUMN "embedding" SET NOT NULL;
