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
  slots: SlotItem[]         // 本轮所有卡片，两两一对进入下一轮
  gap: number               // 同一对两张卡片之间的间距（px）
  pairGap: number           // 不同对之间的间距（px）
  showConnector: boolean    // 右侧是否画连线（决赛列不画）
  flip?: boolean            // 下半区：连线画在左侧
}

// 一对卡片（2张）+ 右侧连线
function MatchPair({ top, bottom, gap, showConnector, flip }: {
  top: SlotItem; bottom: SlotItem
  gap: number; showConnector: boolean; flip: boolean
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
        <BracketMatchCard match={top.match} homeLabel={top.homeLabel} awayLabel={top.awayLabel} />
        <BracketMatchCard match={bottom.match} homeLabel={bottom.homeLabel} awayLabel={bottom.awayLabel} />
      </div>

      {/* 连线区 */}
      {showConnector && (
        <div className="relative shrink-0" style={{ width: CONNECTOR_W, height: totalH }}>
          {/* 上半截：从上卡片中心向右延伸，再向下到中点 */}
          <div
            className={`absolute border-t border-r ${lineColor}`}
            style={{
              top: CARD_H / 2,
              [flip ? 'right' : 'left']: 0,
              width: CONNECTOR_W,
              height: vertH / 2,
              borderRadius: flip ? '4px 0 0 0' : '0 4px 0 0',
            }}
          />
          {/* 下半截：从中点向下，到下卡片中心 */}
          <div
            className={`absolute border-b border-r ${lineColor}`}
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

export default function BracketColumn({ slots, gap, pairGap, showConnector, flip = false }: Props) {
  // 每两个 slot 为一对
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
        />
      ))}
    </div>
  )
}
