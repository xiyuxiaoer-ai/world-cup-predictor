import BracketMatchCard, { type BracketMatchData } from './BracketMatchCard'

// 每张卡片的固定高度（px）：日期行 + 两队行
export const CARD_H = 68
// 列间连线区域宽度
export const CONNECTOR_W = 24

type SlotItem = {
  match: BracketMatchData | null
  homeLabel: string
  awayLabel: string
}

type Props = {
  slots: SlotItem[]
  gap: number
  pairGap: number
  showConnector: boolean
  flip?: boolean
  roundColor?: string
}

// 一对卡片（2张）+ 右侧连线
function MatchPair({ top, bottom, gap, showConnector, flip, roundColor }: {
  top: SlotItem; bottom: SlotItem
  gap: number; showConnector: boolean; flip: boolean; roundColor?: string
}) {
  // 连线从两张卡片中心延伸，在中点汇合
  // 总高 = CARD_H + gap + CARD_H
  const totalH = CARD_H + gap + CARD_H
  // 垂直线高度 = gap + 各卡片一半高度 × 2 = gap + CARD_H
  const vertH = gap + CARD_H

  const lineColor = 'border-gray-300 dark:border-gray-600'

  return (
    <div className="flex items-stretch" style={{ flexDirection: flip ? 'row-reverse' : 'row' }}>
      {/* 卡片列 */}
      <div className="flex flex-col" style={{ gap }}>
        <BracketMatchCard match={top.match} homeLabel={top.homeLabel} awayLabel={top.awayLabel} roundColor={roundColor} />
        <BracketMatchCard match={bottom.match} homeLabel={bottom.homeLabel} awayLabel={bottom.awayLabel} roundColor={roundColor} />
      </div>

      {/* 连线区 */}
      {showConnector && (
        <div className="relative shrink-0" style={{ width: CONNECTOR_W, height: totalH }}>
          {/* 上半截：上卡片中心 → 水平延伸 → 垂直到中点 */}
          <div
            className={`absolute border-t ${flip ? 'border-l' : 'border-r'} ${lineColor}`}
            style={{
              top: CARD_H / 2,
              [flip ? 'right' : 'left']: 0,
              width: CONNECTOR_W,
              height: vertH / 2,
              borderRadius: flip ? '4px 0 0 0' : '0 4px 0 0',
            }}
          />
          {/* 下半截：中点 → 垂直 → 下卡片中心 */}
          <div
            className={`absolute border-b ${flip ? 'border-l' : 'border-r'} ${lineColor}`}
            style={{
              bottom: CARD_H / 2,
              [flip ? 'right' : 'left']: 0,
              width: CONNECTOR_W,
              height: vertH / 2,
              borderRadius: flip ? '0 0 0 4px' : '0 0 4px 0',
            }}
          />
        </div>
      )}
    </div>
  )
}

export default function BracketColumn({ slots, gap, pairGap, showConnector, flip = false, roundColor }: Props) {
  const pairs: [SlotItem, SlotItem][] = []
  for (let i = 0; i < slots.length; i += 2) {
    pairs.push([slots[i], slots[i + 1] ?? { match: null, homeLabel: '待定', awayLabel: '待定' }])
  }

  return (
    <div className="flex flex-col" style={{ gap: pairGap }}>
      {pairs.map(([top, bottom], i) => (
        <MatchPair
          key={i}
          top={top} bottom={bottom}
          gap={gap}
          showConnector={showConnector}
          flip={flip}
          roundColor={roundColor}
        />
      ))}
    </div>
  )
}
