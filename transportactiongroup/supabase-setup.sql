-- ─────────────────────────────────────────────────────────────────────────────
-- TAG — transportactiongroup.co.za
-- Supabase Database Setup Script
-- Run this in: Supabase Dashboard → SQL Editor → New Query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Site configuration table ───────────────────────────────────────────────
-- Stores all admin-configurable settings as key-value pairs.
CREATE TABLE IF NOT EXISTS site_config (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL DEFAULT ''
);

-- Seed default config values
INSERT INTO site_config (key, value) VALUES
  ('company_name',        'Transport Action Group'),
  ('company_email',       'info@transportactiongroup.co.za'),
  ('company_phone',       '+27 XX XXX XXXX'),
  ('company_address',     ''),
  ('company_reg_number',  ''),
  ('company_vat_number',  ''),
  ('enquiry_notify_email','info@transportactiongroup.co.za'),
  ('whatsapp_number',     ''),
  ('whatsapp_api_token',  ''),
  ('paystack_public_key', ''),
  ('paystack_secret_key', ''),
  ('paystack_mode',       'test'),
  ('impact_trucks',       '0'),
  ('impact_drivers',      '0'),
  ('impact_companies',    '0'),
  ('impact_use_live',     'false')
ON CONFLICT (key) DO NOTHING;

-- ── 2. Enquiries table ────────────────────────────────────────────────────────
-- Stores all contact/partnership enquiries from the TAG and GFA sites.
CREATE TABLE IF NOT EXISTS enquiries (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name         TEXT NOT NULL,
  email        TEXT NOT NULL,
  company      TEXT,
  phone        TEXT,
  message      TEXT,
  source       TEXT DEFAULT 'tag',   -- 'tag' | 'gfa'
  status       TEXT DEFAULT 'new',   -- 'new' | 'read' | 'replied' | 'archived'
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 3. TCO Calculator submissions table ───────────────────────────────────────
-- Stores every TCO calculator session where a user provided their details
-- before downloading a PDF or CSV export.
CREATE TABLE IF NOT EXISTS tco_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name       TEXT NOT NULL,
  user_email      TEXT NOT NULL,
  company         TEXT NOT NULL,
  country         TEXT,
  currency_code   TEXT DEFAULT 'ZAR',
  truck_type      TEXT,
  use_case        TEXT,
  notes           TEXT,
  inputs_json     JSONB,              -- full calculator inputs snapshot
  diesel_tco      NUMERIC,
  electric_tco    NUMERIC,
  total_saving    NUMERIC,
  break_even_year INTEGER,
  export_type     TEXT,               -- 'pdf' | 'csv'
  submitted_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── 4. Admin users table ──────────────────────────────────────────────────────
-- TAG admin accounts. Passwords are bcrypt hashed.
-- To create an admin: see QUICK-START-CARD.md for the bcrypt command.
CREATE TABLE IF NOT EXISTS tag_admins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ── 5. Row Level Security ─────────────────────────────────────────────────────
-- All tables use RLS. The anon key can only read public data.
-- The service role key (used server-side) bypasses RLS.
ALTER TABLE site_config    ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tco_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tag_admins     ENABLE ROW LEVEL SECURITY;

-- Allow anon to read site_config (needed for public pages to fetch config)
CREATE POLICY "Public can read site_config"
  ON site_config FOR SELECT TO anon USING (true);

-- Allow anon to insert enquiries (contact form submissions)
CREATE POLICY "Public can insert enquiries"
  ON enquiries FOR INSERT TO anon WITH CHECK (true);

-- Allow anon to insert tco_submissions (TCO calculator exports)
CREATE POLICY "Public can insert tco_submissions"
  ON tco_submissions FOR INSERT TO anon WITH CHECK (true);

-- All other operations require service role (server-side admin actions)
-- No additional policies needed — service role bypasses RLS by default.

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE. Next step: create your first admin user.
-- See QUICK-START-CARD.md → Step 4 for the exact SQL INSERT command.
-- ─────────────────────────────────────────────────────────────────────────────
