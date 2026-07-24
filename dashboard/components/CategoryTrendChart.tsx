"use client";

import { useRef, useState } from "react";
import { getActiveCategories, getCategoryColor, type Bucket } from "@/lib/stats";

const CHART_HEIGHT = 240;
const COLUMN_WIDTH = 64;
const GRID_TICKS = 4;

function niceMax(value: number): number {
  if (value <= 0) return 1;
  const rounded = Math.ceil(value / 5) * 5;
  return Math.max(rounded, 5);
}

type Tooltip = {
  bucketLabel: string;
  category: string;
  count: number;
  x: number;
  y: number;
};

/** 카테고리별 주간 추이를 선 그래프로 - 막대 차트는 그 주만 훑기엔 좋지만, "몇 주째 커지고
 * 있다" 같은 흐름은 선으로 봐야 한눈에 들어온다. */
export default function CategoryTrendChart({ buckets }: { buckets: Bucket[] }) {
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const categories = getActiveCategories(buckets);

  if (buckets.length === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400">데이터가 없습니다.</p>;
  }

  const maxCount = niceMax(
    Math.max(0, ...buckets.flatMap((b) => categories.map((c) => b.counts[c] ?? 0)))
  );
  const width = Math.max(buckets.length * COLUMN_WIDTH, COLUMN_WIDTH);

  function xFor(i: number): number {
    return i * COLUMN_WIDTH + COLUMN_WIDTH / 2;
  }
  function yFor(count: number): number {
    return CHART_HEIGHT - (count / maxCount) * CHART_HEIGHT;
  }

  function showTooltip(e: React.SyntheticEvent, bucket: Bucket, category: string) {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = (e.currentTarget as SVGElement).getBoundingClientRect();
    if (!containerRect) return;
    setTooltip({
      bucketLabel: bucket.label,
      category,
      count: bucket.counts[category] ?? 0,
      x: targetRect.left - containerRect.left + targetRect.width / 2,
      y: targetRect.top - containerRect.top,
    });
  }

  return (
    <div>
      <div ref={containerRef} className="relative">
        <div className="flex">
          <div
            className="flex flex-col justify-between pr-3 text-xs text-neutral-400 dark:text-neutral-500"
            style={{ height: CHART_HEIGHT }}
          >
            {Array.from({ length: GRID_TICKS + 1 }, (_, i) => (
              <span key={i} className="tabular-nums">
                {Math.round((maxCount * (GRID_TICKS - i)) / GRID_TICKS)}
              </span>
            ))}
          </div>

          <div className="relative flex-1 overflow-x-auto">
            <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
              {Array.from({ length: GRID_TICKS + 1 }, (_, i) => (
                <div key={i} className="border-t border-neutral-200 dark:border-neutral-800" />
              ))}
            </div>

            <svg width={width} height={CHART_HEIGHT} className="block overflow-visible">
              {categories.map((category) => {
                const color = getCategoryColor(category);
                const points = buckets
                  .map((b, i) => `${xFor(i)},${yFor(b.counts[category] ?? 0)}`)
                  .join(" ");
                return (
                  <polyline
                    key={category}
                    points={points}
                    fill="none"
                    stroke={color.light}
                    strokeWidth={2}
                  />
                );
              })}
              {categories.map((category) =>
                buckets.map((b, i) => (
                  <circle
                    key={`${category}-${b.key}`}
                    cx={xFor(i)}
                    cy={yFor(b.counts[category] ?? 0)}
                    r={3.5}
                    fill={getCategoryColor(category).light}
                    className="cursor-pointer"
                    onMouseEnter={(e) => showTooltip(e, b, category)}
                    onFocus={(e) => showTooltip(e, b, category)}
                    onMouseLeave={() => setTooltip(null)}
                    onBlur={() => setTooltip(null)}
                    tabIndex={0}
                    aria-label={`${b.label} ${category} ${b.counts[category] ?? 0}건`}
                  />
                ))
              )}
            </svg>

            <div className="flex" style={{ width }}>
              {buckets.map((b) => (
                <span
                  key={b.key}
                  className="shrink-0 text-center text-xs whitespace-nowrap text-neutral-500 dark:text-neutral-400"
                  style={{ width: COLUMN_WIDTH }}
                >
                  {b.label}
                </span>
              ))}
            </div>
          </div>
        </div>

        {tooltip && (
          <div
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-lg bg-neutral-900 px-3 py-2 text-xs whitespace-nowrap text-white shadow-lg dark:bg-neutral-100 dark:text-neutral-900"
            style={{ left: tooltip.x, top: tooltip.y - 8 }}
          >
            <div className="font-semibold">{tooltip.count}건</div>
            <div className="text-neutral-300 dark:text-neutral-600">
              {tooltip.category} · {tooltip.bucketLabel}
            </div>
          </div>
        )}
      </div>

      {categories.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600 dark:text-neutral-300">
          {categories.map((cat) => (
            <li key={cat} className="flex items-center gap-1.5">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ backgroundColor: getCategoryColor(cat).light }}
              />
              {cat}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
