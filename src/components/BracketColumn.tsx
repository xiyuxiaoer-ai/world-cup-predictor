import BracketMatchCard, { type BracketMatchData } from './BracketMatchCard'

export const CARD_H = 45
export const CONNECTOR_W = 14

type SlotItem = {
  match: BracketMatchData | null
  homeLabel: string
  awayLabel: string
  homeTla?: string | null
  awayTla?: string | null
  homeConfirmed?: boolean
  awayConfirmed?: boolean
}

type Props = {
  slots: SlotItem[]
  gap: number
  pairGap: number
  showConnector: boolean
  flip?: boolean
}

function MatchPair({ top, bottom, gap, showConnector, flip }: {
  top: SlotItem; bottom: SlotItem
  gap: number; showConnector: boolean; flip: boolean
}) {
  const totalH = CARD_H + gap + CARD_H
  const vertH = gap + CARD_H

  return (
    <div className="flex items-stretch" style={{ flexDirection: flip ? 'row-reverse' : 'row' }}>
      <div className="flex flex-col" style={{ gap }}>
        <BracketMatchCard
          match={top.match} homeLabel={top.homeLabel} awayLabel={top.awayLabel}
          homeTla={top.homeTla} awayTla={top.awayTla}
          homeConfirmed={top.homeConfirmed} awayConfirmed={top.awayConfirmed}
        />
        <BracketMatchCard
          match={bottom.match} homeLabel={bottom.homeLabel} awayLabel={bottom.awayLabel}
          homeTla={bottom.homeTla} awayTla={bottom.awayTla}
          homeConfirmed={bottom.homeConfirmed} awayConfirmed={bottom.awayConfirmed}
        />
      </div>

      {showConnector && (
        <div className="relative shrink-0" style={{ width: CONNECTOR_W, height: totalH }}>
          <div
            className={`absolute border-t ${flip ? 'border-l' : 'border-r'} border-gray-300/80 dark:border-gray-500/50`}
            style={{
              top: CARD_H / 2,
              [flip ? 'right' : 'left']: 0,
              width: CONNECTOR_W,
              height: vertH / 2,
              borderRadius: flip ? '4px 0 0 0' : '0 4px 0 0',
            }}
          />
          <div
            className={`absolute border-b ${flip ? 'border-l' : 'border-r'} border-gray-300/80 dark:border-gray-500/50`}
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
  const pairs: [SlotItem, SlotItem][] = []
  for (let i = 0; i < slots.length; i += 2) {
    pairs.push([slots[i], slots[i + 1] ?? { match: null, homeLabel: '待定', awayLabel: '待定' }])
  }

  return (
    <div className="flex flex-col" style={{ gap: pairGap }}>
      {pairs.map(([top, bottom], i) => (
        <MatchPair key={i} top={top} bottom={bottom} gap={gap} showConnector={showConnector} flip={flip} />
      ))}
    </div>
  )
}
