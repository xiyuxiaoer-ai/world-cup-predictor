const FINAL_DATE = new Date('2026-07-23T21:00:00Z')

export function calculateChampionBonus(predictedAt: Date = new Date()): number {
  const d = (FINAL_DATE.getTime() - predictedAt.getTime()) / (1000 * 60 * 60 * 24)
  if (d < 7) return 0                                   // 锁定（4强结束后）
  if (d < 15) return Math.round(d - 3)                 // 4强+8强: 4–10
  if (d < 19) return Math.round(d * 4 / 3 + 2)        // 16强: 22–26
  if (d < 25) return Math.round(d + 10)                // 32强: 29–34
  return Math.min(50, Math.round(d * 2.2 - 18))        // 小组赛: 37–50
}

export const STAGE_LABELS: Record<string, string> = {
  group: '小组赛', round_of_32: '32强', round_of_16: '16强',
  quarter_final: '8强', semi_final: '4强', third_place: '季军赛', final: '决赛',
}
