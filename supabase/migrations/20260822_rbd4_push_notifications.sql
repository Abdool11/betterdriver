CREATE TABLE IF NOT EXISTS driver_push_subscriptions (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
 endpoint TEXT UNIQUE NOT NULL,
 subscription JSONB NOT NULL,
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_driver_push_subscriptions_driver ON driver_push_subscriptions(driver_id) WHERE enabled = TRUE;
CREATE TABLE IF NOT EXISTS driver_notification_deliveries (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
 channel TEXT NOT NULL CHECK(channel IN ('push','whatsapp')),
 notification_type TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'queued',
 provider_reference TEXT,
 error_message TEXT,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_driver_notification_deliveries_driver_time ON driver_notification_deliveries(driver_id, created_at DESC);
ALTER TABLE driver_push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE driver_notification_deliveries ENABLE ROW LEVEL SECURITY;
DO $$ BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='driver_push_subscriptions' AND policyname='push_subscriptions_service_only') THEN
  CREATE POLICY "push_subscriptions_service_only" ON driver_push_subscriptions FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='driver_notification_deliveries' AND policyname='push_delivery_service_only') THEN
  CREATE POLICY "push_delivery_service_only" ON driver_notification_deliveries FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
 END IF;
END $$;
