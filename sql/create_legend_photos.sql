-- Legend player photos pre-fetched from Wikipedia
-- Run this in Supabase SQL Editor before populating via /api/admin/populate-legend-photos

CREATE TABLE IF NOT EXISTS legend_photos (
  name_en  TEXT PRIMARY KEY,
  photo_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE legend_photos ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "legend_photos_public_read"
  ON legend_photos FOR SELECT USING (true);

-- Service role write
CREATE POLICY "legend_photos_service_write"
  ON legend_photos FOR ALL USING (auth.role() = 'service_role');
