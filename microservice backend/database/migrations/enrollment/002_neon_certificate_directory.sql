-- Run against the Neon database configured by CERTIFICATE_DIRECTORY_DATABASE_URL.
-- It may point to the existing enrollment Neon database/schema.

CREATE TABLE IF NOT EXISTS certificate_directory (
  "certificateNumber" VARCHAR(255) PRIMARY KEY,
  "userId" VARCHAR(255) NOT NULL,
  "enrollmentId" UUID NOT NULL,
  "shardId" INTEGER NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS certificate_directory_user_id_idx
  ON certificate_directory ("userId");
