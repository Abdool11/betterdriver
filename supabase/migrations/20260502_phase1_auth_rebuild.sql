-- ============================================================
-- BD Phase 1: Hybrid token auth rebuild (no password for drivers)
-- Applied: 2026-05-02
-- ============================================================

-- 1. Rename activated_at → first_accessed_at on driver_invitations
--    (audit only — no longer gates access)
ALTER TABLE driver_invitations
  RENAME COLUMN activated_at TO first_accessed_at;

-- 2. Add revoked_at for instant operator revocation
ALTER TABLE driver_invitations
  ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ DEFAULT NULL;

-- 3. Add invite_video_url — the Bunny.net video URL sent with the magic link
ALTER TABLE driver_invitations
  ADD COLUMN IF NOT EXISTS invite_video_url TEXT DEFAULT NULL;

-- 4. Remove password_hash from drivers table (drivers never create passwords)
--    We keep the column nullable rather than dropping it to avoid breaking
--    any existing rows; the application will no longer write to it.
ALTER TABLE drivers
  ALTER COLUMN password_hash DROP NOT NULL;

-- 5. Session token blocklist — for server-side JWT invalidation on revocation
CREATE TABLE IF NOT EXISTS session_token_blocklist (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  driver_id       UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  blocked_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reason          TEXT DEFAULT NULL  -- e.g. 'operator_revoked', 'session_expired'
);

CREATE INDEX IF NOT EXISTS idx_blocklist_driver_id ON session_token_blocklist(driver_id);

-- 6. Add program_assignment to driver_invitations
--    Values: 'p1', 'p2', 'p1_p2'
ALTER TABLE driver_invitations
  ADD COLUMN IF NOT EXISTS program_assignment TEXT DEFAULT 'p1';

-- 7. Add language_preference to drivers table
--    Values: 'en', 'zu', 'af'
ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- 8. GFA video library table (managed by GFA admin, used for invite + marketing videos)
CREATE TABLE IF NOT EXISTS gfa_videos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  description     TEXT DEFAULT NULL,
  video_type      TEXT NOT NULL DEFAULT 'invite',
  -- video_type: 'invite' (sent with magic link), 'teaser' (marketing), 'portal_walkthrough', 'module'
  bunny_video_id  TEXT DEFAULT NULL,   -- Bunny.net Stream video ID
  bunny_library_id TEXT DEFAULT NULL,  -- Bunny.net library ID
  playback_url    TEXT DEFAULT NULL,   -- HLS stream URL
  thumbnail_url   TEXT DEFAULT NULL,
  duration_seconds INT DEFAULT NULL,
  language        TEXT DEFAULT 'en',   -- 'en', 'zu', 'af'
  programme       TEXT DEFAULT NULL,   -- 'p1', 'p2', null (for general/marketing)
  is_public       BOOLEAN DEFAULT FALSE, -- true for teaser/welcome videos (no auth required)
  upload_status   TEXT DEFAULT 'pending', -- 'pending', 'processing', 'ready', 'error'
  created_by      UUID DEFAULT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gfa_videos_type ON gfa_videos(video_type);
CREATE INDEX IF NOT EXISTS idx_gfa_videos_language ON gfa_videos(language);

-- 9. Link training_campaigns to an invite video
ALTER TABLE training_campaigns
  ADD COLUMN IF NOT EXISTS invite_video_id UUID REFERENCES gfa_videos(id) ON DELETE SET NULL;

-- 10. Add WhatsApp bulletin notification config fields to bulletins
--     These are the selectable fields the operator chooses when creating a bulletin
ALTER TABLE bulletins
  ADD COLUMN IF NOT EXISTS wa_notify_drivers BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wa_include_topic BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wa_include_urgency BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wa_include_link BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS wa_custom_message TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wa_sent_at TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS wa_sent_count INT DEFAULT 0;
