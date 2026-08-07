-- AlterEnum
ALTER TYPE "QuoteStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "quotes" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "internalNotes" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "sentAt" TIMESTAMP(3);
