import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { calculateChampionBonus, STAGE_LABELS } from '@/lib/championBonus'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const [{ data: prediction }, { data: nextMatch }, homeTeams, awayTeams] = await Promise.all([
    supabase.from('champion_predictions').select('*').eq('user_id', user.id).single(),
    supabase.from('matches').select('stage').eq('status', 'scheduled').order('kickoff_time', { ascending: true }).limit(1).single(),
    supabase.from('matches').select('home_team, home_tla').neq('home_team', 'TBD'),
    supabase.from('matches').select('away_team, away_tla').neq('away_team', 'TBD'),
  ])

  const currentStage = nextMatch?.stage || 'final'
  const currentBonus = calculateChampionBonus(new Date())
  const isLocked = currentBonus === 0

  // Deduplicate teams by TLA
  const teamMap = new Map<string, { name: string; tla: string }>()
  for (const m of homeTeams.data || []) {
    if (m.home_tla) teamMap.set(m.home_tla, { name: m.home_team, tla: m.home_tla })
  }
  for (const m of awayTeams.data || []) {
    if (m.away_tla) teamMap.set(m.away_tla, { name: m.away_team, tla: m.away_tla })
  }
  const teams = Array.from(teamMap.values()).sort((a, b) => a.name.localeCompare(b.name))

  return NextResponse.json({
    prediction: prediction || null,
    currentBonus,
    currentStage,
    currentStageLabel: STAGE_LABELS[currentStage] || currentStage,
    isLocked,
    teams,
  })
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { predicted_team, predicted_team_tla } = await req.json()
  if (!predicted_team) return NextResponse.json({ error: '请选择一支球队' }, { status: 400 })

  const now = new Date()
  const bonus = calculateChampionBonus(now)
  if (bonus === 0) return NextResponse.json({ error: '彩蛋已锁定，无法提交' }, { status: 400 })

  // Check already predicted
  const { data: existing } = await supabase
    .from('champion_predictions')
    .select('id')
    .eq('user_id', user.id)
    .single()
  if (existing) return NextResponse.json({ error: '你已经猜过冠军了，不可更改' }, { status: 400 })

  // Determine current stage
  const { data: nextMatch } = await supabase
    .from('matches')
    .select('stage')
    .eq('status', 'scheduled')
    .order('kickoff_time', { ascending: true })
    .limit(1)
    .single()
  const currentStage = nextMatch?.stage || 'final'

  const { error } = await supabase.from('champion_predictions').insert({
    user_id: user.id,
    predicted_team,
    predicted_team_tla: predicted_team_tla || null,
    predicted_at: now.toISOString(),
    stage_at_prediction: currentStage,
    bonus_points: bonus,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, bonus_points: bonus, stage: currentStage })
}
