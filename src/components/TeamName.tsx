import { getTeamJa } from '@/lib/flags'

export default function TeamName({ tla, zh }: { tla: string | null | undefined; zh: string }) {
  const ja = getTeamJa(tla)
  return (
    <span className="inline-flex flex-col leading-tight gap-0.5">
      <span>{zh}</span>
      {ja && <span className="text-[10px] font-normal text-gray-400 dark:text-gray-500">{ja}</span>}
    </span>
  )
}
