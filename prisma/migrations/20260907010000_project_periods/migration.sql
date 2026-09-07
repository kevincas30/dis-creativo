-- CreateEnum
CREATE TYPE "ProjectKind" AS ENUM ('ONE_OFF', 'RECURRING');

-- CreateEnum
CREATE TYPE "RelationshipStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "WorkItemKind" AS ENUM ('TASK', 'DELIVERABLE');

-- CreateEnum
CREATE TYPE "WorkPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ProjectStatus" ADD VALUE 'DELIVERED';
ALTER TYPE "ProjectStatus" ADD VALUE 'CLOSED';
ALTER TYPE "ProjectStatus" ADD VALUE 'PAUSED';
ALTER TYPE "ProjectStatus" ADD VALUE 'CANCELLED';

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "archivedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "agreedTotal" DECIMAL(12,2),
ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "currency" "Currency",
ADD COLUMN     "kind" "ProjectKind" NOT NULL DEFAULT 'ONE_OFF',
ADD COLUMN     "paymentDueDate" DATE,
ADD COLUMN     "quoteId" TEXT,
ADD COLUMN     "relationshipStatus" "RelationshipStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "events" ADD COLUMN     "periodId" TEXT;

-- CreateTable
CREATE TABLE "project_periods" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "startDate" DATE NOT NULL,
    "dueDate" DATE,
    "status" "ProjectStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "agreedTotal" DECIMAL(12,2),
    "currency" "Currency",
    "paymentDueDate" DATE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_periods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodId" TEXT,
    "amount" DECIMAL(12,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "paidAt" DATE NOT NULL,
    "note" TEXT,
    "recordedById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_items" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodId" TEXT,
    "title" TEXT NOT NULL,
    "kind" "WorkItemKind" NOT NULL DEFAULT 'TASK',
    "priority" "WorkPriority" NOT NULL DEFAULT 'NORMAL',
    "dueDate" DATE,
    "recurring" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "work_assignments" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "periodId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "work_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activity_records" (
    "id" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "projectId" TEXT,
    "periodId" TEXT,
    "clientId" TEXT,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activity_records_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "project_periods_projectId_startDate_key" ON "project_periods"("projectId", "startDate");

-- CreateIndex
CREATE UNIQUE INDEX "project_periods_id_projectId_key" ON "project_periods"("id", "projectId");

-- CreateIndex
CREATE UNIQUE INDEX "payments_requestId_key" ON "payments"("requestId");

-- CreateIndex
CREATE INDEX "payments_projectId_periodId_idx" ON "payments"("projectId", "periodId");

-- CreateIndex
CREATE INDEX "work_items_projectId_periodId_idx" ON "work_items"("projectId", "periodId");

-- CreateIndex
CREATE UNIQUE INDEX "work_assignments_projectId_periodId_userId_key" ON "work_assignments"("projectId", "periodId", "userId");

-- CreateIndex
CREATE INDEX "activity_records_projectId_periodId_createdAt_idx" ON "activity_records"("projectId", "periodId", "createdAt");

-- CreateIndex
CREATE INDEX "activity_records_clientId_createdAt_idx" ON "activity_records"("clientId", "createdAt");

-- CreateIndex
CREATE INDEX "projects_clientId_idx" ON "projects"("clientId");

-- CreateIndex
CREATE INDEX "projects_quoteId_idx" ON "projects"("quoteId");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "quotes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "project_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_periods" ADD CONSTRAINT "project_periods_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "project_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_items" ADD CONSTRAINT "work_items_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "project_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_assignments" ADD CONSTRAINT "work_assignments_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_assignments" ADD CONSTRAINT "work_assignments_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "project_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "work_assignments" ADD CONSTRAINT "work_assignments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_records" ADD CONSTRAINT "activity_records_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_records" ADD CONSTRAINT "activity_records_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_records" ADD CONSTRAINT "activity_records_periodId_fkey" FOREIGN KEY ("periodId") REFERENCES "project_periods"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activity_records" ADD CONSTRAINT "activity_records_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Data integrity for new records. Existing data and statuses are not rewritten.
ALTER TABLE "projects" ADD CONSTRAINT "projects_agreed_total_check" CHECK ("agreedTotal" IS NULL OR "agreedTotal" >= 0);
ALTER TABLE "project_periods" ADD CONSTRAINT "period_total_check" CHECK ("agreedTotal" IS NULL OR "agreedTotal" >= 0), ADD CONSTRAINT "period_dates_check" CHECK ("dueDate" IS NULL OR "dueDate" >= "startDate");
ALTER TABLE "payments" ADD CONSTRAINT "payment_amount_check" CHECK ("amount" > 0);
CREATE UNIQUE INDEX "work_assignments_project_user_unique" ON "work_assignments" ("projectId", "userId") WHERE "periodId" IS NULL;
ALTER TABLE "payments" ADD CONSTRAINT "payment_period_project_fkey" FOREIGN KEY ("periodId", "projectId") REFERENCES "project_periods" ("id", "projectId") ON DELETE RESTRICT;
ALTER TABLE "work_items" ADD CONSTRAINT "work_period_project_fkey" FOREIGN KEY ("periodId", "projectId") REFERENCES "project_periods" ("id", "projectId") ON DELETE RESTRICT;
ALTER TABLE "work_assignments" ADD CONSTRAINT "assignment_period_project_fkey" FOREIGN KEY ("periodId", "projectId") REFERENCES "project_periods" ("id", "projectId") ON DELETE RESTRICT;
ALTER TABLE "events" ADD CONSTRAINT "event_period_project_fkey" FOREIGN KEY ("periodId", "projectId") REFERENCES "project_periods" ("id", "projectId") ON DELETE RESTRICT, ADD CONSTRAINT "event_period_scope_check" CHECK ("periodId" IS NULL OR "projectId" IS NOT NULL);
ALTER TABLE "activity_records" ADD CONSTRAINT "activity_period_project_fkey" FOREIGN KEY ("periodId", "projectId") REFERENCES "project_periods" ("id", "projectId") ON DELETE RESTRICT, ADD CONSTRAINT "activity_period_scope_check" CHECK ("periodId" IS NULL OR "projectId" IS NOT NULL);

CREATE FUNCTION check_work_scope() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE project_kind "ProjectKind";
BEGIN
  SELECT "kind" INTO project_kind FROM "projects" WHERE "id" = NEW."projectId";
  IF (project_kind = 'RECURRING' AND NEW."periodId" IS NULL) OR (project_kind = 'ONE_OFF' AND NEW."periodId" IS NOT NULL) THEN
    RAISE EXCEPTION 'Work and payments must belong to the correct project/period scope';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER payment_scope BEFORE INSERT OR UPDATE ON "payments" FOR EACH ROW EXECUTE FUNCTION check_work_scope();
CREATE TRIGGER work_scope BEFORE INSERT OR UPDATE ON "work_items" FOR EACH ROW EXECUTE FUNCTION check_work_scope();

-- Private studio data is accessed via the authenticated server, not the public Data API.
ALTER TABLE "project_periods" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_items" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "work_assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "activity_records" ENABLE ROW LEVEL SECURITY;
