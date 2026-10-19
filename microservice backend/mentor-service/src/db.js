import pg from "pg";

const { Pool } = pg;
export const pool = new Pool({
  connectionString: process.env.MENTOR_DATABASE_URL || "postgresql://postgres:malay21@127.0.0.1:5432/mentor_db",
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined,
  max: Number(process.env.DB_POOL_MAX || 15),
  idleTimeoutMillis: 30000,
});

export async function initializeDatabase() {
  let connected = false;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    try { await pool.query("SELECT 1"); connected = true; break; }
    catch (error) {
      if (attempt === 30) throw error;
      console.warn(`[Mentor Service] Database not ready (${attempt}/30); retrying.`);
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  if (!connected) throw new Error("Mentor database is unavailable.");
  await pool.query(`
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    CREATE TABLE IF NOT EXISTS mentor_applications (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), user_id uuid NOT NULL UNIQUE,
      name text NOT NULL, email text NOT NULL, expertise text[] NOT NULL DEFAULT '{}',
      experience_years integer NOT NULL DEFAULT 0, bio text NOT NULL, status text NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected')),
      reviewer_id uuid, review_note text NOT NULL DEFAULT '', reviewed_at timestamptz,
      created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS mentor_applications_status_created_idx ON mentor_applications(status, created_at DESC);
    CREATE TABLE IF NOT EXISTS mentor_sessions (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), mentor_id uuid NOT NULL, title text NOT NULL,
      description text NOT NULL DEFAULT '', topic text NOT NULL, format text NOT NULL
        CHECK (format IN ('one_to_one','group_class','small_group')),
      scheduled_at timestamptz NOT NULL, started_at timestamptz, duration_minutes integer NOT NULL CHECK (duration_minutes BETWEEN 15 AND 240),
      max_participants integer NOT NULL CHECK (max_participants BETWEEN 1 AND 1000),
      status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended','cancelled')),
      room_name text NOT NULL UNIQUE, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS mentor_sessions_schedule_idx ON mentor_sessions(status, scheduled_at);
    CREATE INDEX IF NOT EXISTS mentor_sessions_mentor_idx ON mentor_sessions(mentor_id, scheduled_at DESC);
    CREATE TABLE IF NOT EXISTS mentor_enrollments (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
      user_id uuid NOT NULL, status text NOT NULL DEFAULT 'enrolled' CHECK (status IN ('enrolled','cancelled')),
      joined_at timestamptz, left_at timestamptz, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(session_id,user_id)
    );
    ALTER TABLE mentor_enrollments ADD COLUMN IF NOT EXISTS left_at timestamptz;
    ALTER TABLE mentor_sessions ADD COLUMN IF NOT EXISTS started_at timestamptz;
    CREATE INDEX IF NOT EXISTS mentor_enrollments_user_idx ON mentor_enrollments(user_id,status);
    CREATE TABLE IF NOT EXISTS mentor_chat_messages (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
      user_id uuid NOT NULL, user_name text NOT NULL, body text NOT NULL CHECK (length(body) <= 2000),
      created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS mentor_chat_history_idx ON mentor_chat_messages(session_id,created_at DESC);
    CREATE TABLE IF NOT EXISTS mentor_polls (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(), session_id uuid NOT NULL REFERENCES mentor_sessions(id) ON DELETE CASCADE,
      created_by uuid NOT NULL, question text NOT NULL, options jsonb NOT NULL,
      active boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
    );
    CREATE TABLE IF NOT EXISTS mentor_poll_votes (
      poll_id uuid NOT NULL REFERENCES mentor_polls(id) ON DELETE CASCADE, user_id uuid NOT NULL,
      option_index integer NOT NULL, created_at timestamptz NOT NULL DEFAULT now(), PRIMARY KEY(poll_id,user_id)
    );
  `);
}
