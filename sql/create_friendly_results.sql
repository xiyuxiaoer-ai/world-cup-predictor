-- Run this in Supabase SQL Editor (once)
CREATE TABLE IF NOT EXISTS friendly_results (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  api_match_id    integer UNIQUE NOT NULL,
  home_team       text    NOT NULL,
  away_team       text    NOT NULL,
  home_tla        text,
  away_tla        text,
  home_score      integer NOT NULL,
  away_score      integer NOT NULL,
  match_date      date    NOT NULL,
  competition     text    NOT NULL DEFAULT '友谊赛',
  created_at      timestamptz DEFAULT now()
);

-- Allow read by anyone (anon/authenticated)
ALTER TABLE friendly_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON friendly_results FOR SELECT USING (true);
