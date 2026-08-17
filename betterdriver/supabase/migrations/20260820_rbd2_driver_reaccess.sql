-- ============================================================
-- RBD-2: Secure driver re-access request audit trail
-- ============================================================

CREATE TABLE IF NOT EXISTS driver_reaccess_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id UUID NULL REFERENCES drivers(id) ON DELETE SET NULL,
  company_id UUID NULL REFERENCES companies(id) ON DELETE SET NULL,
  mobile_hash TEXT NOT NULL,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  delivery_status TEXT NOT NULL DEFAULT 'accepted',
  delivery_error TEXT NULL,
  request_ip_hash TEXT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_driver_reaccess_requests_mobile_requested
  ON driver_reaccess_requests (mobile_hash, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_driver_reaccess_requests_driver_requested
  ON driver_reaccess_requests (driver_id, requested_at DESC);

ALTER TABLE driver_reaccess_requests ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'driver_reaccess_requests'
      AND policyname = 'Service role manages driver reaccess requests'
  ) THEN
    CREATE POLICY "Service role manages driver reaccess requests"
      ON driver_reaccess_requests
      FOR ALL
      USING (auth.role() = 'service_role')
      WITH CHECK (auth.role() = 'service_role');
  END IF;
END
$$;
