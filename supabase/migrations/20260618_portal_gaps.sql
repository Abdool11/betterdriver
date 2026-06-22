-- ============================================================
-- BD Portal Data-Fetching Gap Fill
-- Applied: 2026-06-18
-- ============================================================

-- 1. Add CPD module scheduling fields for urgency calculation
ALTER TABLE cpd_modules
  ADD COLUMN IF NOT EXISTS moodle_course_id INTEGER,
  ADD COLUMN IF NOT EXISTS quarter INTEGER,
  ADD COLUMN IF NOT EXISTS year INTEGER,
  ADD COLUMN IF NOT EXISTS due_date TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_cpd_modules_due_date ON cpd_modules(due_date);
CREATE INDEX IF NOT EXISTS idx_cpd_modules_year_quarter ON cpd_modules(year, quarter);

-- 2. Link CPD participation to a specific driver enrolment
ALTER TABLE driver_cpd_participation
  ADD COLUMN IF NOT EXISTS enrolment_id UUID REFERENCES enrolments(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_driver_cpd_participation_enrolment ON driver_cpd_participation(enrolment_id);

-- 3. Support tickets table
CREATE TABLE IF NOT EXISTS support_tickets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id     UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  message       TEXT NOT NULL,
  status        TEXT DEFAULT 'open',  -- 'open', 'in_progress', 'resolved', 'closed'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  resolved_at   TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_driver ON support_tickets(driver_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
