-- Fase 2: columnas y relaciones aditivas. No modifica ni elimina presupuestos históricos.
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'READY_TO_SEND';
ALTER TYPE "QuoteStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';

CREATE TYPE "DepositKind" AS ENUM ('PERCENTAGE', 'FIXED', 'FULL', 'NONE');

ALTER TABLE "quotes"
  ADD COLUMN "responsibleId" TEXT,
  ADD COLUMN "depositKind" "DepositKind" NOT NULL DEFAULT 'PERCENTAGE',
  ADD COLUMN "depositValue" DECIMAL(10,2) NOT NULL DEFAULT 50;

ALTER TABLE "quote_status_history"
  ADD COLUMN "changedById" TEXT;

ALTER TABLE "events"
  ADD COLUMN "quoteId" TEXT;

ALTER TABLE "quotes"
  ADD CONSTRAINT "quotes_responsibleId_fkey"
  FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "quote_status_history"
  ADD CONSTRAINT "quote_status_history_changedById_fkey"
  FOREIGN KEY ("changedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "events"
  ADD CONSTRAINT "events_quoteId_fkey"
  FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "events_quoteId_idx" ON "events"("quoteId");
