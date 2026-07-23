"use client";

import { useRef, useState } from "react";
import { getActiveProviderLabels, getProviderColor, type UsageBucket } from "@/lib/aiUsage";

const CHART_HEIGHT = 240;
const BAR_WIDTH = 32;
const GRID_TICKS = 4;

export type LabeledUsageBucket = UsageBucket & { label: string };

type Tooltip = {
  bucketLabel: string;
  provider: string;
  pct: number;
  x: number;
  y: number;
};

function bucketTotal(bucket: LabeledUsageBucket): number {
  return Object.values(bucket.tokens).reduce((sum, n) => sum + n, 0);
}

export default function AiUsageChart({ buckets }: { buckets: LabeledUsageBucket[] }) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [view, setView] = useState<"chart" | "table">("chart");
  const containerRef = useRef<HTMLDivElement>(null);
  const providers = getActiveProviderLabels(buckets);

  function showTooltip(e: React.SyntheticEvent, bucket: LabeledUsageBucket, provider: string) {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      bucketLabel: bucket.label,
      provider,
      pct: bucket.shares[provider] ?? 0,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
    });
  }

  if (buckets.length === 0) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400">아직 수집된 데이터가 없습니다.</p>
    );
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => setView(view === "chart" ? "table" : "chart")}
          className="text-sm font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          {view === "chart" ? "표로 보기" : "차트로 보기"}
        </button>
      </div>

      {view === "table" ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="py-2 pr-4 font-medium">주차</th>
                {providers.map((p) => (
                  <th key={p} className="py-2 pr-4 font-medium whitespace-nowrap">
                    {p}
                  </th>
                ))}
                <th className="py-2 font-medium">합계 토큰</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr
                  key={bucket.week}
                  className="border-b border-neutral-100 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300"
                >
                  <td className="py-2 pr-4 font-medium whitespace-nowrap text-neutral-900 dark:text-neutral-100">
                    {bucket.label}
                  </td>
                  {providers.map((p) => (
                    <td key={p} className="py-2 pr-4 tabular-nums whitespace-nowrap">
                      {(bucket.tokens[p] ?? 0).toLocaleString()}
                      <span className="ml-1 text-neutral-400 dark:text-neutral-500">
                        ({(bucket.shares[p] ?? 0).toFixed(1)}%)
                      </span>
                    </td>
                  ))}
                  <td className="py-2 font-semibold tabular-nums whitespace-nowrap">
                    {bucketTotal(bucket).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={containerRef} className="relative mt-4">
          <div className="flex">
            <div
              className="flex flex-col justify-between pr-3 text-xs text-neutral-400 dark:text-neutral-500"
              style={{ height: CHART_HEIGHT }}
            >
              {Array.from({ length: GRID_TICKS + 1 }, (_, i) => (
                <span key={i} className="tabular-nums">
                  {Math.round((100 * (GRID_TICKS - i)) / GRID_TICKS)}%
                </span>
              ))}
            </div>

            <div className="relative flex-1 overflow-x-auto">
              <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
                {Array.from({ length: GRID_TICKS + 1 }, (_, i) => (
                  <div key={i} className="border-t border-neutral-200 dark:border-neutral-800" />
                ))}
              </div>

              <div className="relative flex items-end gap-4" style={{ height: CHART_HEIGHT }}>
                {buckets.map((bucket) => (
                  <div key={bucket.week} className="flex flex-col items-center gap-2">
                    <div
                      className="flex flex-col-reverse overflow-hidden rounded-t"
                      style={{ width: BAR_WIDTH }}
                    >
                      {providers
                        .filter((p) => (bucket.shares[p] ?? 0) > 0)
                        .map((provider, i, arr) => {
                          const pct = bucket.shares[provider] ?? 0;
                          const height = Math.max((pct / 100) * CHART_HEIGHT, 2);
                          const color = getProviderColor(provider);
                          const isTop = i === arr.length - 1;
                          return (
                            <button
                              key={provider}
                              type="button"
                              onMouseEnter={(e) => showTooltip(e, bucket, provider)}
                              onFocus={(e) => showTooltip(e, bucket, provider)}
                              onMouseLeave={() => setTooltip(null)}
                              onBlur={() => setTooltip(null)}
                              aria-label={`${bucket.label} ${provider} ${pct}%`}
                              className="mb-0.5 w-full shrink-0 transition-[filter] hover:brightness-110"
                              style={{
                                height,
                                backgroundColor: color.light,
                                borderTopLeftRadius: isTop ? 4 : 0,
                                borderTopRightRadius: isTop ? 4 : 0,
                              }}
                            />
                          );
                        })}
                    </div>
                    <span className="whitespace-nowrap text-xs text-neutral-500 dark:text-neutral-400">
                      {bucket.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {tooltip && (
            <div
              className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-neutral-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
              style={{ left: tooltip.x, top: tooltip.y - 8 }}
            >
              <div className="font-semibold">{tooltip.pct}%</div>
              <div className="text-neutral-300 dark:text-neutral-600">
                {tooltip.provider} · {tooltip.bucketLabel}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "chart" && providers.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600 dark:text-neutral-300">
          {providers.map((p) => (
            <li key={p} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: getProviderColor(p).light }}
              />
              {p}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
