export type BracketSlot = {
  homeLabel: string
  awayLabel: string
  half: 'upper' | 'lower'
  matchNum: number       // FIFA match number (73-104)
  round: 'r32' | 'r16' | 'qf' | 'sf' | 'final'
  posInRound: number     // 1-based position within (round × half), top-to-bottom
  feedsInto: number      // matchNum of the next-round match this feeds into
}

// ─────────────────────────────────────────────
// R32 matches keyed by api_match_id
// ─────────────────────────────────────────────
export const R32_SLOTS: Record<number, BracketSlot> = {
  // 上半区 — positions 1-8
  537417: { homeLabel: 'A2', awayLabel: 'B2',                  half: 'upper', matchNum: 73, round: 'r32', posInRound: 1, feedsInto: 89 },
  537423: { homeLabel: 'C1', awayLabel: 'F2',                  half: 'upper', matchNum: 75, round: 'r32', posInRound: 2, feedsInto: 89 },
  537415: { homeLabel: 'E1', awayLabel: '最佳第三(A/B/C/D/F)', half: 'upper', matchNum: 74, round: 'r32', posInRound: 3, feedsInto: 90 },
  537418: { homeLabel: 'I1', awayLabel: '最佳第三(C/D/F/G/H)', half: 'upper', matchNum: 77, round: 'r32', posInRound: 4, feedsInto: 90 },
  537421: { homeLabel: 'D1', awayLabel: '最佳第三(B/E/F/I/J)', half: 'upper', matchNum: 81, round: 'r32', posInRound: 5, feedsInto: 93 },
  537420: { homeLabel: 'G1', awayLabel: '最佳第三(A/E/H/I/J)', half: 'upper', matchNum: 82, round: 'r32', posInRound: 6, feedsInto: 93 },
  537429: { homeLabel: 'K2', awayLabel: 'L2',                  half: 'upper', matchNum: 83, round: 'r32', posInRound: 7, feedsInto: 94 },
  537428: { homeLabel: 'H1', awayLabel: 'J2',                  half: 'upper', matchNum: 84, round: 'r32', posInRound: 8, feedsInto: 94 },
  // 下半区 — positions 1-8
  537416: { homeLabel: 'F1', awayLabel: 'C2',                  half: 'lower', matchNum: 76, round: 'r32', posInRound: 1, feedsInto: 91 },
  537424: { homeLabel: 'E2', awayLabel: 'I2',                  half: 'lower', matchNum: 78, round: 'r32', posInRound: 2, feedsInto: 91 },
  537425: { homeLabel: 'A1', awayLabel: '最佳第三(C/E/F/H/I)', half: 'lower', matchNum: 79, round: 'r32', posInRound: 3, feedsInto: 92 },
  537426: { homeLabel: 'L1', awayLabel: '最佳第三(E/H/I/J/K)', half: 'lower', matchNum: 80, round: 'r32', posInRound: 4, feedsInto: 92 },
  537422: { homeLabel: 'B1', awayLabel: '最佳第三(E/F/G/I/J)', half: 'lower', matchNum: 85, round: 'r32', posInRound: 5, feedsInto: 95 },
  537419: { homeLabel: 'K1', awayLabel: '最佳第三(D/E/I/J/L)', half: 'lower', matchNum: 87, round: 'r32', posInRound: 6, feedsInto: 95 },
  537427: { homeLabel: 'J1', awayLabel: 'H2',                  half: 'lower', matchNum: 86, round: 'r32', posInRound: 7, feedsInto: 96 },
  537430: { homeLabel: 'D2', awayLabel: 'G2',                  half: 'lower', matchNum: 88, round: 'r32', posInRound: 8, feedsInto: 96 },
}

// ─────────────────────────────────────────────
// 后续轮次 keyed by matchNum (89-104)
// stage 值对应数据库 stage 字段
// ─────────────────────────────────────────────
export type LaterRoundSlot = {
  half: 'upper' | 'lower' | 'final'
  round: 'r16' | 'qf' | 'sf' | 'final'
  stage: string
  posInRound: number
  feedsInto: number | null
}

export const LATER_ROUNDS: Record<number, LaterRoundSlot> = {
  // R16 — 上半区
  89: { half: 'upper', round: 'r16', stage: 'round_of_16', posInRound: 1, feedsInto: 97 },
  90: { half: 'upper', round: 'r16', stage: 'round_of_16', posInRound: 2, feedsInto: 97 },
  93: { half: 'upper', round: 'r16', stage: 'round_of_16', posInRound: 3, feedsInto: 98 },
  94: { half: 'upper', round: 'r16', stage: 'round_of_16', posInRound: 4, feedsInto: 98 },
  // R16 — 下半区
  91: { half: 'lower', round: 'r16', stage: 'round_of_16', posInRound: 1, feedsInto: 99 },
  92: { half: 'lower', round: 'r16', stage: 'round_of_16', posInRound: 2, feedsInto: 99 },
  95: { half: 'lower', round: 'r16', stage: 'round_of_16', posInRound: 3, feedsInto: 100 },
  96: { half: 'lower', round: 'r16', stage: 'round_of_16', posInRound: 4, feedsInto: 100 },
  // QF — 上半区
  97: { half: 'upper', round: 'qf', stage: 'quarter_final', posInRound: 1, feedsInto: 101 },
  98: { half: 'upper', round: 'qf', stage: 'quarter_final', posInRound: 2, feedsInto: 101 },
  // QF — 下半区
  99: { half: 'lower', round: 'qf', stage: 'quarter_final', posInRound: 1, feedsInto: 102 },
  100: { half: 'lower', round: 'qf', stage: 'quarter_final', posInRound: 2, feedsInto: 102 },
  // SF
  101: { half: 'upper', round: 'sf', stage: 'semi_final', posInRound: 1, feedsInto: 104 },
  102: { half: 'lower', round: 'sf', stage: 'semi_final', posInRound: 1, feedsInto: 104 },
  // Final
  104: { half: 'final', round: 'final', stage: 'final', posInRound: 1, feedsInto: null },
}

// ─────────────────────────────────────────────
// 工具函数
// ─────────────────────────────────────────────
export function getSlotLabel(apiMatchId: number, isHome: boolean): string {
  const slot = R32_SLOTS[apiMatchId]
  if (!slot) return '待定'
  const raw = isHome ? slot.homeLabel : slot.awayLabel
  return raw.match(/^[A-L][12]$/)
    ? `${raw[0]}组第${raw[1] === '1' ? '1' : '2'}名`
    : raw
}

export const BRACKET_SLOTS = R32_SLOTS
