-- CreateTable
CREATE TABLE "Partnership" (
    "id" TEXT NOT NULL,
    "emailId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "from" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "analysis" JSONB NOT NULL,
    "status" TEXT NOT NULL,
    "notes" TEXT,
    "value" DOUBLE PRECISION,
    "accountId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partnership_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Partnership_emailId_key" ON "Partnership"("emailId");

-- CreateIndex
CREATE INDEX "Partnership_status_idx" ON "Partnership"("status");

-- CreateIndex
CREATE INDEX "Partnership_accountId_idx" ON "Partnership"("accountId");

-- AddForeignKey
ALTER TABLE "Partnership" ADD CONSTRAINT "Partnership_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "SocialAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;
