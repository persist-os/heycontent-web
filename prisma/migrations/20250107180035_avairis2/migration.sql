-- DropIndex
DROP INDEX "rag_documents_metadata_idx";

-- CreateIndex
CREATE INDEX "rag_documents_content_hash_idx" ON "rag_documents"("content_hash");

-- CreateIndex
CREATE INDEX "rag_documents_metadata_idx" ON "rag_documents"("metadata");
