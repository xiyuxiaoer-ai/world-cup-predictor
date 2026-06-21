-- Run this in Supabase SQL Editor (recreates table for FIFA API string IDs)
DROP TABLE IF EXISTS friendly_results;

CREATE TABLE friendly_results (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  fifa_match_id   text    UNIQUE NOT NULL,
  home_team       text    NOT NULL,
  away_team       text    NOT NULL,
  home_tla        text,
  away_tla        text,
  home_score      integer NOT NULL,
  away_score      integer NOT NULL,
  match_date      date    NOT NULL,
  competition     text    NOT NULL DEFAULT '热身赛',
  created_at      timestamptz DEFAULT now()
);

ALTER TABLE friendly_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON friendly_results FOR SELECT USING (true);
