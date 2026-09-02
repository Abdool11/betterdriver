-- ============================================================
-- BD Phase 1: Moodle Integration Fields
-- Applied: 2026-05-04
-- ============================================================
-- Adds the columns needed for webhook + polling sync between
-- BetterDriver and Moodle, and for WhatsApp inactivity triggers.

-- 1. Add Moodle user ID to drivers table
--    Set by BD when the driver is created in Moodle via moodleCreateUser()
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS moodle_user_id INTEGER DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_drivers_moodle_user_id ON drivers(moodle_user_id);

-- 2. Add progress tracking columns to enrolments
ALTER TABLE enrolments
  ADD COLUMN IF NOT EXISTS progress_percent INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS modules_completed INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Add WhatsApp inactivity nudge tracking to enrolments
--    Prevents duplicate messages being sent for the same trigger
ALTER TABLE enrolments
  ADD COLUMN IF NOT EXISTS wa_7day_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wa_14day_sent_at TIMESTAMPTZ DEFAULT NULL;

-- 4. Add programme_slug to enrolments for Moodle course ID lookup
ALTER TABLE enrolments
  ADD COLUMN IF NOT EXISTS programme_slug TEXT DEFAULT 'professional-truck-driver';

-- 5. Index for polling query (active, incomplete enrolments with old activity)
CREATE INDEX IF NOT EXISTS idx_enrolments_active_incomplete
  ON enrolments(status, completed_at, last_activity_at)
  WHERE status = 'active' AND completed_at IS NULL;

-- 6. Webhook event log — for debugging and audit trail
CREATE TABLE IF NOT EXISTS moodle_webhook_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  received_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  moodle_user_id  INTEGER,
  course_id       INTEGER,
  event_type      TEXT,
  completion_state INTEGER,
  payload         JSONB,
  processed       BOOLEAN DEFAULT FALSE,
  error           TEXT DEFAULT NULL
);

CREATE INDEX IF NOT EXISTS idx_webhook_log_received ON moodle_webhook_log(received_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_log_user ON moodle_webhook_log(moodle_user_id);
