import type { KeywordTrend } from "@/lib/stats";

function deltaLabel(delta: number, hasLastWeek: boolean): { text: string; className: string } {
  if (!hasLastWeek) {
    return { text: "-", className: "text-neutral-400 dark:text-neutral-500" };
  }
  if (delta > 0) {
    return { text: `▲ ${delta}`, className: "text-red-600 dark:text-red-400" };
  }
  if (delta < 0) {
    return { text: `▼ ${Math.abs(delta)}`, className: "text-blue-600 dark:text-blue-400" };
  }
  return { text: "-", className: "text-neutral-400 dark:text-neutral-500" };
}

export default function KeywordTrendTable({ trend }: { trend: KeywordTrend }) {
  if (trend.rows.length === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400">데이터가 없습니다.</p>;
  }

  return (
    <div>
      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        {trend.thisWeekLabel} 기준
        {trend.lastWeekLabel && ` (직전 주 ${trend.lastWeekLabel} 대비 증감)`}
      </p>
      <ul className="mt-3 space-y-1.5">
        {trend.rows.map((row, i) => {
          const delta = deltaLabel(row.delta, trend.lastWeekLabel !== null);
          return (
            <li
              key={row.keyword}
              className="flex items-center gap-3 rounded-md px-2 py-1.5 text-sm odd:bg-neutral-50 dark:odd:bg-neutral-900"
            >
              <span className="w-5 shrink-0 text-right text-xs text-neutral-400 dark:text-neutral-500">
                {i + 1}
              </span>
              <span className="flex-1 font-medium text-neutral-900 dark:text-neutral-100">
                {row.keyword}
              </span>
              <span className="tabular-nums text-neutral-500 dark:text-neutral-400">
                {row.thisWeek}건
              </span>
              <span className={`w-14 shrink-0 text-right text-xs tabular-nums ${delta.className}`}>
                {delta.text}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
