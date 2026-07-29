-- CreateTable: singleton rules / terms page content
CREATE TABLE "rules_content" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "updated_label" TEXT,
    "intro" TEXT,
    "body" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rules_content_pkey" PRIMARY KEY ("id")
);
