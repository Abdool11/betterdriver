-- ============================================================
-- BD: Per-module video progress tracking
-- Applied: 2026-06-18
-- ============================================================
-- Stores partial progress (percent watched) for each driver+module
-- so the course listing can show "In progress" even when Moodle
-- hasn't recorded full completion yet.

CREATE TABLE IF NOT EXISTS driver_module_progress (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  module_id       TEXT NOT NULL,          -- Moodle course-module ID (cmid)
  percent_watched INTEGER NOT NULL DEFAULT 0 CHECK (percent_watched >= 0 AND percent_watched <= 100),
  last_watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(driver_id, module_id)
);

CREATE INDEX IF NOT EXISTS idx_driver_module_progress_driver
  ON driver_module_progress(driver_id);

CREATE INDEX IF NOT EXISTS idx_driver_module_progress_module
  ON driver_module_progress(module_id);
