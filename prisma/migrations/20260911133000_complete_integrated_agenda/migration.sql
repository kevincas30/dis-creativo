-- Fase 5: campos opcionales para responsable, todo el día y horas de trabajo.
-- Migración exclusivamente aditiva; los datos existentes conservan sus valores.
ALTER TABLE "events" ADD COLUMN "responsibleId" TEXT;
ALTER TABLE "events" ADD COLUMN "allDay" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "work_items" ADD COLUMN "startTime" TEXT;
ALTER TABLE "work_items" ADD COLUMN "dueTime" TEXT;

CREATE INDEX "events_workspaceId_responsibleId_idx" ON "events"("workspaceId", "responsibleId");
ALTER TABLE "events" ADD CONSTRAINT "events_responsibleId_fkey" FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
