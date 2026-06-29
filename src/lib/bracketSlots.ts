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
  // 上半区 — positions 1-8（GER/FRA→R16-89/537375, RSA/NED→R16-90/537376, K2/ESP→R16-93, USA/BEL→R16-94）
  537415: { homeLabel: 'E1', awayLabel: '最佳第三(A/B/C/D/F)', half: 'upper', matchNum: 73, round: 'r32', posInRound: 1, feedsInto: 89 },
  537416: { homeLabel: 'I1', awayLabel: '最佳第三(C/D/F/G/H)', half: 'upper', matchNum: 74, round: 'r32', posInRound: 2, feedsInto: 89 },
  537417: { homeLabel: 'A2', awayLabel: 'B2',                  half: 'upper', matchNum: 75, round: 'r32', posInRound: 3, feedsInto: 90 },
  537418: { homeLabel: 'F1', awayLabel: 'C2',                  half: 'upper', matchNum: 76, round: 'r32', posInRound: 4, feedsInto: 90 },
  537420: { homeLabel: 'K2', awayLabel: 'L2',                  half: 'upper', matchNum: 77, round: 'r32', posInRound: 5, feedsInto: 93 },
  537430: { homeLabel: 'H1', awayLabel: 'J2',                  half: 'upper', matchNum: 78, round: 'r32', posInRound: 6, feedsInto: 93 },
  537421: { homeLabel: 'D1', awayLabel: '最佳第三(B/E/F/I/J)', half: 'upper', matchNum: 79, round: 'r32', posInRound: 7, feedsInto: 94 },
  537422: { homeLabel: 'G1', awayLabel: '最佳第三(A/E/H/I/J)', half: 'upper', matchNum: 80, round: 'r32', posInRound: 8, feedsInto: 94 },
  // 下半区 — positions 1-8（与懂球帝对齐：BRA/CIV→R16-91, MEX/ENG→R16-92, ARG/AUS→R16-95, SUI/K1→R16-96）
  537423: { homeLabel: 'C1', awayLabel: 'F2',                  half: 'lower', matchNum: 81, round: 'r32', posInRound: 1, feedsInto: 91 },
  537424: { homeLabel: 'E2', awayLabel: 'I2',                  half: 'lower', matchNum: 82, round: 'r32', posInRound: 2, feedsInto: 91 },
  537425: { homeLabel: 'A1', awayLabel: '最佳第三(C/E/F/H/I)', half: 'lower', matchNum: 83, round: 'r32', posInRound: 3, feedsInto: 92 },
  537426: { homeLabel: 'L1', awayLabel: '最佳第三(E/H/I/J/K)', half: 'lower', matchNum: 84, round: 'r32', posInRound: 4, feedsInto: 92 },
  537427: { homeLabel: 'J1', awayLabel: 'H2',                  half: 'lower', matchNum: 85, round: 'r32', posInRound: 5, feedsInto: 95 },
  537428: { homeLabel: 'D2', awayLabel: 'G2',                  half: 'lower', matchNum: 86, round: 'r32', posInRound: 6, feedsInto: 95 },
  537429: { homeLabel: 'B1', awayLabel: '最佳第三(E/F/G/I/J)', half: 'lower', matchNum: 87, round: 'r32', posInRound: 7, feedsInto: 96 },
  537419: { homeLabel: 'K1', awayLabel: '最佳第三(D/E/J/L)',   half: 'lower', matchNum: 88, round: 'r32', posInRound: 8, feedsInto: 96 },
}

// ─────────────────────────────────────────────
// R16+ 精确映射：api_match_id → matchNum
// 由 football-data.org API 分配的固定 ID，永不变更
// 时间验证：上半区 R16(07/04,07/06 UTC)→QF(07/09,07/10)→SF(07/14)
//           下半区 R16(07/05,07/07 UTC)→QF(07/11,07/12)→SF(07/15)→Final(07/19)
// ─────────────────────────────────────────────
export const LATER_SLOT_BY_ID: Record<number, number> = {
  // R16 — 上半区 (07/04 UTC × 2, 07/06 UTC × 2)
  537376: 90,   // 07/04 17:00 UTC → upper pos2 (RSA/NED 路)
  537375: 89,   // 07/04 21:00 UTC → upper pos1 (GER/FRA 路)
  537379: 93,   // 07/06 19:00 UTC → upper pos3
  537380: 94,   // 07/07 00:00 UTC → upper pos4
  // R16 — 下半区 (07/05 UTC × 2, 07/07 UTC × 2)
  537377: 91,   // 07/05 20:00 UTC → lower pos1
  537378: 92,   // 07/06 00:00 UTC → lower pos2
  537381: 95,   // 07/07 16:00 UTC → lower pos3
  537382: 96,   // 07/07 20:00 UTC → lower pos4
  // QF — 上半区
  537383: 97,   // 07/09 20:00 UTC
  537384: 98,   // 07/10 19:00 UTC
  // QF — 下半区
  537385: 99,   // 07/11 21:00 UTC
  537386: 100,  // 07/12 01:00 UTC
  // SF
  537387: 101,  // 07/14 19:00 UTC → upper
  537388: 102,  // 07/15 19:00 UTC → lower
  // Final
  537390: 104,  // 07/19 19:00 UTC
}

// ─────────────────────────────────────────────
// 后续轮次 keyed by matchNum (89-104)
// stage 值对应数据库 stage 字段（仅保留作为结构参考，不用于位置分配）
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
