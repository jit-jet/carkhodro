-- AlterTable
ALTER TABLE "car_brands" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "car_models" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "parts_brands" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "categories" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "car_brands_is_active_idx" ON "car_brands"("is_active");

-- CreateIndex
CREATE INDEX "car_models_is_active_idx" ON "car_models"("is_active");

-- CreateIndex
CREATE INDEX "parts_brands_is_active_idx" ON "parts_brands"("is_active");

-- CreateIndex
CREATE INDEX "categories_is_active_idx" ON "categories"("is_active");
