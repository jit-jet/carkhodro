CREATE TABLE "return_content" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "body" TEXT NOT NULL DEFAULT '',
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "return_content_pkey" PRIMARY KEY ("id")
);
