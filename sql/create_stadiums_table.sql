-- Stadium data with photos from football2026tips.com
-- Run in Supabase SQL Editor before populating via /api/admin/populate-stadiums

CREATE TABLE IF NOT EXISTS stadiums (
  name_zh   TEXT PRIMARY KEY,   -- matches key in venues.ts e.g. 'AT&T体育场'
  name_en   TEXT NOT NULL,
  capacity  INTEGER,
  opened    INTEGER,
  photo_url TEXT,               -- Unsplash or Wikimedia Commons URL
  lat       DOUBLE PRECISION,
  lon       DOUBLE PRECISION,
  slug      TEXT,               -- football2026tips.com slug e.g. 'dallas'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE stadiums ENABLE ROW LEVEL SECURITY;

CREATE POLICY "stadiums_public_read"
  ON stadiums FOR SELECT USING (true);

CREATE POLICY "stadiums_service_write"
  ON stadiums FOR ALL USING (auth.role() = 'service_role');
