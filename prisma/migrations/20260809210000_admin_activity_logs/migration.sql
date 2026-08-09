CREATE TYPE "AdminActivityStatus" AS ENUM ('SUCCESS', 'FAILURE', 'BLOCKED');

CREATE TABLE "admin_activity_logs" (
    "id" TEXT NOT NULL,
    "actor_id" TEXT,
    "actor_username" TEXT,
    "action" TEXT NOT NULL,
    "status" "AdminActivityStatus" NOT NULL,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "admin_activity_logs_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "admin_activity_logs_created_at_idx" ON "admin_activity_logs"("created_at");
CREATE INDEX "admin_activity_logs_actor_id_created_at_idx" ON "admin_activity_logs"("actor_id", "created_at");
CREATE INDEX "admin_activity_logs_action_created_at_idx" ON "admin_activity_logs"("action", "created_at");
CREATE INDEX "admin_activity_logs_status_created_at_idx" ON "admin_activity_logs"("status", "created_at");

ALTER TABLE "admin_activity_logs"
ADD CONSTRAINT "admin_activity_logs_actor_id_fkey"
FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
