-- ============================================================
-- BetterDriver: Moodle learning-progress integrity repair
-- Date: 2026-10-13
--
-- Adds minimal audit fields for replay-safe Moodle activity-completion
-- webhooks. No learner content, certificate data, GFA data or cross-product
-- data is copied into BetterDriver.
-- ============================================================

ALTER TABLE moodle_webhook_log
  ADD COLUMN IF NOT EXISTS module_cmid INTEGER,
  ADD COLUMN IF NOT EXISTS event_key TEXT;

-- PostgreSQL permits multiple NULL values in a unique index, allowing legacy
-- audit rows while ensuring newly received, keyed Moodle events are processed
-- once only.
CREATE UNIQUE INDEX IF NOT EXISTS idx_moodle_webhook_log_event_key
  ON moodle_webhook_log(event_key);

CREATE INDEX IF NOT EXISTS idx_moodle_webhook_log_module_cmid
  ON moodle_webhook_log(moodle_user_id, course_id, module_cmid);
