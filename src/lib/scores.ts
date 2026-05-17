import type { Match, Prediction } from '@/types'

const DOUBLE_STAGES = ['quarter_final', 'semi_final', 'third_place', 'final']
const KNOCKOUT_STAGES = ['round_of_32', 'round_of_16', ...DOUBLE_STAGES]

export function calculatePoints(match: Match, prediction: Prediction): number {
  if (match.status !== 'finished' || match.result_90 === null) return 0

  const isDouble = DOUBLE_STAGES.includes(match.stage)
  const isGroup = match.stage === 'group'
  const m = isDouble ? 2 : 1
  const outcomeBase = isGroup ? 3 : 4
  const bonusBase = 2

  const h = prediction.pred_home_score
  const a = prediction.pred_away_score
  let predResult: string
  if (h > a) predResult = 'home_win'
  else if (a > h) predResult = 'away_win'
  else predResult = 'draw'

  if (predResult !== match.result_90) return 0

  let points = outcomeBase * m

  if (h === match.home_score_90 && a === match.away_score_90) {
    points += bonusBase * m
  }

  if (predResult === 'draw' && KNOCKOUT_STAGES.includes(match.stage)) {
    const etEndedInDraw = match.et_winner === null && match.penalty_winner !== null

    // 加时赛得分：猜对加时赛胜者，或双方都预测加时平且实际加时平
    if (match.et_winner && prediction.pred_et_winner === match.et_winner) {
      points += bonusBase * m
    } else if (etEndedInDraw && prediction.pred_et_winner === 'draw') {
      points += bonusBase * m
    }

    // 点球得分：猜对点球胜者
    if (match.penalty_winner && prediction.pred_penalty_winner === match.penalty_winner) {
      points += bonusBase * m
    }
  }

  return points
}

export function getMissPenalty(stage: string): number {
  if (stage === 'group') return -1
  if (['round_of_32', 'round_of_16'].includes(stage)) return -2
  return -4
}
