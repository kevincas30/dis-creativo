-- Fase 3: datos aditivos para preparación de proyecto, anticipos y tareas revisables.
-- No elimina ni renombra datos históricos.
CREATE TYPE "PaymentType" AS ENUM ('DEPOSIT', 'BALANCE', 'PARTIAL');

ALTER TABLE "projects"
  ADD COLUMN "responsibleId" TEXT,
  ADD COLUMN "startDate" DATE,
  ADD COLUMN "depositExpected" DECIMAL(12,2),
  ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "project_periods"
  ADD COLUMN "depositExpected" DECIMAL(12,2);

ALTER TABLE "payments"
  ADD COLUMN "type" "PaymentType" NOT NULL DEFAULT 'PARTIAL';

ALTER TABLE "work_items"
  ADD COLUMN "responsibleId" TEXT,
  ADD COLUMN "needsReview" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "projects"
  ADD CONSTRAINT "projects_responsibleId_fkey"
  FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "work_items"
  ADD CONSTRAINT "work_items_responsibleId_fkey"
  FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "projects_workspaceId_archivedAt_idx" ON "projects"("workspaceId", "archivedAt");
CREATE INDEX "projects_responsibleId_idx" ON "projects"("responsibleId");
CREATE INDEX "payments_type_idx" ON "payments"("type");
CREATE INDEX "work_items_responsibleId_idx" ON "work_items"("responsibleId");
