-- Drop old PANAS columns (safe if already removed)
ALTER TABLE "Participant" DROP COLUMN IF EXISTS "panasAlert";
ALTER TABLE "Participant" DROP COLUMN IF EXISTS "panasAshamed";
ALTER TABLE "Participant" DROP COLUMN IF EXISTS "panasAttentive";
ALTER TABLE "Participant" DROP COLUMN IF EXISTS "panasDetermined";
ALTER TABLE "Participant" DROP COLUMN IF EXISTS "panasHostile";
-- Add new PANAS columns (safe if already exist)
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "panasAnxious" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "panasDistressed" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "panasEnergetic" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "panasExcited" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "panasHappy" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "panasInterested" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Participant" ADD COLUMN IF NOT EXISTS "panasStressed" INTEGER NOT NULL DEFAULT 3;
ALTER TABLE "Participant" ALTER COLUMN "panasAnxious" DROP DEFAULT;
ALTER TABLE "Participant" ALTER COLUMN "panasDistressed" DROP DEFAULT;
ALTER TABLE "Participant" ALTER COLUMN "panasEnergetic" DROP DEFAULT;
ALTER TABLE "Participant" ALTER COLUMN "panasExcited" DROP DEFAULT;
ALTER TABLE "Participant" ALTER COLUMN "panasHappy" DROP DEFAULT;
ALTER TABLE "Participant" ALTER COLUMN "panasInterested" DROP DEFAULT;
ALTER TABLE "Participant" ALTER COLUMN "panasStressed" DROP DEFAULT;
-- Add indexes
CREATE INDEX IF NOT EXISTS "Participant_name_idx" ON "Participant"("name");
CREATE INDEX IF NOT EXISTS "Participant_createdAt_idx" ON "Participant"("createdAt");
CREATE INDEX IF NOT EXISTS "Prompt_participantId_idx" ON "Prompt"("participantId");
