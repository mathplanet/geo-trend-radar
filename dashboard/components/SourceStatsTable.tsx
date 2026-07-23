import type { SourceStat } from "@/lib/stats";

function noiseClass(pct: number): string {
  if (pct >= 30) return "text-red-600 dark:text-red-400";
  if (pct >= 15) return "text-amber-600 dark:text-amber-400";
  return "text-neutral-500 dark:text-neutral-400";
}

export default function SourceStatsTable({ stats }: { stats: SourceStat[] }) {
  if (stats.length === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400">데이터가 없습니다.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
            <th className="py-2 pr-4 font-medium">소스</th>
            <th className="py-2 pr-4 font-medium">등급</th>
            <th className="py-2 pr-4 font-medium">수집 건수</th>
            <th className="py-2 pr-4 font-medium">노이즈 비율</th>
            <th className="py-2 font-medium">평균 관련도</th>
          </tr>
        </thead>
        <tbody>
          {stats.map((s) => (
            <tr
              key={s.source}
              className="border-b border-neutral-100 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300"
            >
              <td className="py-2 pr-4 font-medium whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                {s.source}
              </td>
              <td className="py-2 pr-4 whitespace-nowrap text-neutral-500 dark:text-neutral-400">
                {s.tier ?? "-"}
              </td>
              <td className="py-2 pr-4 tabular-nums">{s.total}</td>
              <td className={`py-2 pr-4 tabular-nums ${noiseClass(s.noisePct)}`}>
                {s.noisePct.toFixed(0)}%
                <span className="ml-1 text-neutral-400 dark:text-neutral-500">
                  ({s.noiseCount}건)
                </span>
              </td>
              <td className="py-2 tabular-nums">{s.avgScore.toFixed(1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
