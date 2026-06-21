// Final: July 23, 2026 (approximate kickoff UTC)
const FINAL_DATE = new Date('2026-07-23T21:00:00Z')

export function calculateChampionBonus(predictedAt: Date = new Date()): number {
  const daysUntilFinal = (FINAL_DATE.getTime() - predictedAt.getTime()) / (1000 * 60 * 60 * 24)
  if (daysUntilFinal < 4) return 0 // locked after semi-finals
  if (daysUntilFinal <= 10) return Math.min(10, Math.round(daysUntilFinal)) // QF/SF: 4–10
  const raw = Math.round(daysUntilFinal * 1.5) + 5
  return Math.min(50, raw) // Group/R32/R16: 22–50
}

export const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '8强', semi_final: '4强', third_place: '季军赛', final: '决赛',
}
