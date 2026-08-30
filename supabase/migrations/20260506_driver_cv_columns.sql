-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: 20260506_driver_cv_columns
-- Adds driver CV / professional profile columns that are used by
-- the /api/portal/cv route but were missing from the drivers table.
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS licence_class      TEXT,          -- e.g. 'Code 14', 'Code 10'
  ADD COLUMN IF NOT EXISTS licence_number     TEXT,
  ADD COLUMN IF NOT EXISTS licence_expiry     DATE,
  ADD COLUMN IF NOT EXISTS years_experience   INT,
  ADD COLUMN IF NOT EXISTS vehicle_types      TEXT[];        -- array: ['truck','tanker','flatbed']
