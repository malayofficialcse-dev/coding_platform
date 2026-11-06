-- Run against each Neon primary/database branch used as an enrollment shard.
-- Set the correct schema before running, for example:
-- SET search_path TO public;

CREATE TABLE IF NOT EXISTS enrollments (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user" VARCHAR(255) NOT NULL,
  course VARCHAR(255) NOT NULL,
  "shardId" INTEGER NOT NULL DEFAULT 0,
  "enrolledAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
  "completedSubtopics" JSONB NOT NULL DEFAULT '[]'::jsonb,
  progress INTEGER NOT NULL DEFAULT 0,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "certificateNumber" VARCHAR(255),
  "certificateIssuedAt" TIMESTAMP WITH TIME ZONE,
  "certificateRecipientName" VARCHAR(255),
  "certificateCeoName" VARCHAR(255) DEFAULT 'Malay Maity',
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

ALTER TABLE IF EXISTS enrollments
  ADD COLUMN IF NOT EXISTS "shardId" INTEGER NOT NULL DEFAULT 0;

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_user_course_unique
  ON enrollments ("user", course);

CREATE INDEX IF NOT EXISTS enrollments_user_created_at_idx
  ON enrollments ("user", "createdAt");

CREATE UNIQUE INDEX IF NOT EXISTS enrollments_certificate_number_unique
  ON enrollments ("certificateNumber")
  WHERE "certificateNumber" IS NOT NULL;
