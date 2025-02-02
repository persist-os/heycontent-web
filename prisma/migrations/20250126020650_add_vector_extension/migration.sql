/*
  Warnings:

  - You are about to drop the column `status` on the `Conversation` table. All the data in the column will be lost.
  - You are about to drop the column `metadata` on the `Message` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[content_hash]` on the table `rag_documents` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversationId_fkey";

-- AlterTable
ALTER TABLE "Conversation" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "Message" DROP COLUMN "metadata";

-- AlterTable
ALTER TABLE "rag_documents" RENAME CONSTRAINT "rag_documents_new_pkey" TO "rag_documents_pkey";

-- DropEnum
DROP TYPE "ConversationStatus";

-- CreateIndex
CREATE UNIQUE INDEX "rag_documents_content_hash_key" ON "rag_documents"("content_hash");

-- CreateIndex
CREATE INDEX "rag_documents_metadata_idx" ON "rag_documents"("metadata");

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
