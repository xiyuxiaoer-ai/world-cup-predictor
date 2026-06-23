export type BracketSlot = {
  homeLabel: string
  awayLabel: string
  half: 'upper' | 'lower'
  bracketPos: number  // 1-8 within half, top-to-bottom
  r16Pair: number     // which R16 match (1-8) this feeds into
}

export const BRACKET_SLOTS: Record<number, BracketSlot> = {
  // ── 上半区 ──────────────────────────────────────────
  537417: { homeLabel: 'A2', awayLabel: 'B2',                  half: 'upper', bracketPos: 1, r16Pair: 1 },
  537423: { homeLabel: 'C1', awayLabel: 'F2',                  half: 'upper', bracketPos: 2, r16Pair: 1 },
  537415: { homeLabel: 'E1', awayLabel: '最佳第三(A/B/C/D/F)', half: 'upper', bracketPos: 3, r16Pair: 2 },
  537418: { homeLabel: 'I1', awayLabel: '最佳第三(C/D/F/G/H)', half: 'upper', bracketPos: 4, r16Pair: 2 },
  537421: { homeLabel: 'D1', awayLabel: '最佳第三(B/E/F/I/J)', half: 'upper', bracketPos: 5, r16Pair: 3 },
  537420: { homeLabel: 'G1', awayLabel: '最佳第三(A/E/H/I/J)', half: 'upper', bracketPos: 6, r16Pair: 3 },
  537429: { homeLabel: 'K2', awayLabel: 'L2',                  half: 'upper', bracketPos: 7, r16Pair: 4 },
  537428: { homeLabel: 'H1', awayLabel: 'J2',                  half: 'upper', bracketPos: 8, r16Pair: 4 },

  // ── 下半区 ──────────────────────────────────────────
  537416: { homeLabel: 'F1', awayLabel: 'C2',                  half: 'lower', bracketPos: 1, r16Pair: 5 },
  537424: { homeLabel: 'E2', awayLabel: 'I2',                  half: 'lower', bracketPos: 2, r16Pair: 5 },
  537425: { homeLabel: 'A1', awayLabel: '最佳第三(C/E/F/H/I)', half: 'lower', bracketPos: 3, r16Pair: 6 },
  537426: { homeLabel: 'L1', awayLabel: '最佳第三(E/H/I/J/K)', half: 'lower', bracketPos: 4, r16Pair: 6 },
  537422: { homeLabel: 'B1', awayLabel: '最佳第三(E/F/G/I/J)', half: 'lower', bracketPos: 5, r16Pair: 7 },
  537419: { homeLabel: 'K1', awayLabel: '最佳第三(D/E/I/J/L)', half: 'lower', bracketPos: 6, r16Pair: 7 },
  537427: { homeLabel: 'J1', awayLabel: 'H2',                  half: 'lower', bracketPos: 7, r16Pair: 8 },
  537430: { homeLabel: 'D2', awayLabel: 'G2',                  half: 'lower', bracketPos: 8, r16Pair: 8 },
}

export function getSlotLabel(apiMatchId: number, isHome: boolean): string {
  const slot = BRACKET_SLOTS[apiMatchId]
  if (!slot) return '待定'
  const raw = isHome ? slot.homeLabel : slot.awayLabel
  // 把 "A1" 变成 "A组第1名"，"最佳第三(X)" 保持不变
  return raw.match(/^[A-L][12]$/)
    ? `${raw[0]}组第${raw[1] === '1' ? '1' : '2'}名`
    : raw
}
