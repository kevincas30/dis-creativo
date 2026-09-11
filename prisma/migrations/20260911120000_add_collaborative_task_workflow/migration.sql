-- Fase 4: amplía WorkItem como única entidad de tareas compartidas.
-- Todos los cambios son aditivos salvo permitir tareas internas sin proyecto.
CREATE TYPE "TaskStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'IN_REVIEW', 'COMPLETED');

ALTER TABLE "work_items"
  ALTER COLUMN "projectId" DROP NOT NULL,
  ADD COLUMN "description" TEXT,
  ADD COLUMN "status" "TaskStatus" NOT NULL DEFAULT 'PENDING',
  ADD COLUMN "startDate" DATE,
  ADD COLUMN "createdById" TEXT,
  ADD COLUMN "archivedAt" TIMESTAMP(3);

ALTER TABLE "activity_records" ADD COLUMN "workItemId" TEXT;

CREATE TABLE "task_comments" (
  "id" TEXT NOT NULL,
  "workItemId" TEXT NOT NULL,
  "authorId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "task_comments_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "work_items" ADD CONSTRAINT "work_items_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "activity_records" ADD CONSTRAINT "activity_records_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_workItemId_fkey" FOREIGN KEY ("workItemId") REFERENCES "work_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE INDEX "work_items_workspaceId_status_idx" ON "work_items"("workspaceId", "status");
CREATE INDEX "work_items_workspaceId_responsibleId_status_idx" ON "work_items"("workspaceId", "responsibleId", "status");
CREATE INDEX "task_comments_workItemId_createdAt_idx" ON "task_comments"("workItemId", "createdAt");
CREATE INDEX "task_comments_authorId_idx" ON "task_comments"("authorId");
CREATE INDEX "activity_records_workItemId_createdAt_idx" ON "activity_records"("workItemId", "createdAt");
