-- ─── Add missing columns to certifications table ──────────────────────────────
-- These columns exist in the canonical schema but were not applied to the
-- live database. They are required for certificate generation and PDF storage.

ALTER TABLE public.certifications
  ADD COLUMN IF NOT EXISTS certificate_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS programme TEXT DEFAULT 'p1',
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS pdf_url TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS moodle_certificate_id INT,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Ensure indexes exist for the new columns
CREATE INDEX IF NOT EXISTS idx_certifications_number ON public.certifications(certificate_number);
CREATE INDEX IF NOT EXISTS idx_certifications_status ON public.certifications(status);

-- Backfill existing rows so they remain valid if the application starts
-- querying them with status/programme filters.
UPDATE public.certifications
SET status = COALESCE(status, 'active'),
    programme = COALESCE(programme, 'p1');

-- ─── Storage bucket for generated certificate PDFs ────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES ('certificates', 'certificates', true)
ON CONFLICT (id) DO NOTHING;
