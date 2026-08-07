-- AlterTable
ALTER TABLE "quotes" DROP COLUMN "internalNotes";

-- CreateTable
CREATE TABLE "quote_notes" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quote_notes_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "quote_notes" ADD CONSTRAINT "quote_notes_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
