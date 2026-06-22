-- World Cup 2026 squad members (players + coaching staff)
DROP TABLE IF EXISTS team_squads;

CREATE TABLE team_squads (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  tla             text    NOT NULL,
  shirt_number    integer,
  position        text    CHECK (position IN ('GK', 'DEF', 'MID', 'FWD', 'HEAD_COACH', 'ASST_COACH', 'COACH')),
  player_name     text    NOT NULL,
  player_name_zh  text,
  club            text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX ON team_squads (tla);

ALTER TABLE team_squads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read" ON team_squads FOR SELECT USING (true);
CREATE POLICY "service role write" ON team_squads FOR ALL USING (auth.role() = 'service_role');
