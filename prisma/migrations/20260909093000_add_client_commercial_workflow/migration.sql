-- Fase 1: el mismo registro Client representa prospectos y clientes.
-- Esta migración es aditiva: conserva IDs, contactos, presupuestos, eventos,
-- proyectos y actividad existentes.

CREATE TYPE "ClientStage" AS ENUM ('PROSPECT', 'CLIENT');
CREATE TYPE "ProspectStatus" AS ENUM ('NEW', 'CONTACTED', 'QUOTE', 'WON', 'LOST');
CREATE TYPE "LeadSource" AS ENUM ('INSTAGRAM', 'WHATSAPP', 'REFERRAL', 'DIRECT', 'OTHER');

ALTER TYPE "EventType" ADD VALUE 'FOLLOW_UP';

ALTER TABLE "clients"
  ADD COLUMN "stage" "ClientStage" NOT NULL DEFAULT 'CLIENT',
  ADD COLUMN "prospectStatus" "ProspectStatus" NOT NULL DEFAULT 'WON',
  ADD COLUMN "source" "LeadSource",
  ADD COLUMN "responsibleId" TEXT,
  ADD COLUMN "instagram" TEXT,
  ADD COLUMN "emailNormalized" TEXT,
  ADD COLUMN "phoneNormalized" TEXT,
  ADD COLUMN "instagramNormalized" TEXT,
  ADD COLUMN "convertedAt" TIMESTAMP(3),
  ADD COLUMN "nextFollowUpEventId" TEXT;

CREATE UNIQUE INDEX "clients_nextFollowUpEventId_key" ON "clients"("nextFollowUpEventId");
CREATE INDEX "clients_workspaceId_emailNormalized_idx" ON "clients"("workspaceId", "emailNormalized");
CREATE INDEX "clients_workspaceId_phoneNormalized_idx" ON "clients"("workspaceId", "phoneNormalized");
CREATE INDEX "clients_workspaceId_instagramNormalized_idx" ON "clients"("workspaceId", "instagramNormalized");
CREATE INDEX "clients_workspaceId_responsibleId_idx" ON "clients"("workspaceId", "responsibleId");
CREATE INDEX "clients_workspaceId_stage_prospectStatus_idx" ON "clients"("workspaceId", "stage", "prospectStatus");

ALTER TABLE "clients"
  ADD CONSTRAINT "clients_responsibleId_fkey"
  FOREIGN KEY ("responsibleId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "clients_nextFollowUpEventId_fkey"
  FOREIGN KEY ("nextFollowUpEventId") REFERENCES "events"("id") ON DELETE SET NULL ON UPDATE CASCADE;
