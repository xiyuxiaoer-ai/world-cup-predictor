export interface Match {
  id: string
  api_match_id: number
  stage: string
  home_team: string
  away_team: string
  kickoff_time: string
  lock_time: string
  status: 'scheduled' | 'finished'
  home_score_90: number | null
  away_score_90: number | null
  result_90: 'home_win' | 'away_win' | 'draw' | null
  et_winner: string | null
  penalty_winner: string | null
  home_score_et: number | null
  away_score_et: number | null
  home_score_pen: number | null
  away_score_pen: number | null
  group_name: string | null
  home_tla: string | null
  away_tla: string | null
}

export interface Prediction {
  id: string
  game_id: string
  user_id: string
  match_id: string
  pred_home_score: number
  pred_away_score: number
  pred_et_winner: string | null
  pred_penalty_winner: string | null
  submitted_at: string
  points_earned: number | null
}

export interface GameWithRole {
  id: string
  name: string
  status: string
  role: 'admin' | 'member'
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  display_name: string
  avatar_url: string | null
  total_points: number
  prediction_count: number
}
