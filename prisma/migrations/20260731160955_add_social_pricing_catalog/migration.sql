-- AlterTable
ALTER TABLE "quote_line_items" ADD COLUMN     "discountPercent" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "services" ADD COLUMN     "code" TEXT;

-- CreateTable
CREATE TABLE "discount_rules" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "minQty" INTEGER NOT NULL,
    "maxQty" INTEGER,
    "percent" DECIMAL(5,2) NOT NULL,

    CONSTRAINT "discount_rules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "discount_rules_serviceId_minQty_key" ON "discount_rules"("serviceId", "minQty");

-- CreateIndex
CREATE UNIQUE INDEX "services_code_key" ON "services"("code");

-- AddForeignKey
ALTER TABLE "discount_rules" ADD CONSTRAINT "discount_rules_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "services"("id") ON DELETE CASCADE ON UPDATE CASCADE;
