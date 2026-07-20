"use client";

import { useMemo, useRef, useState } from "react";
import {
  aggregateByCategory,
  getActiveCategories,
  getCategoryColor,
  type Bucket,
  type Granularity,
  type StatsItem,
} from "@/lib/stats";

const CHART_HEIGHT = 240;
const BAR_WIDTH = 24;
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

function itemDay(item: StatsItem): string | null {
  const ts = item.collected_at ?? item.published_at;
  return ts ? ts.slice(0, 10) : null;
}

export default function StatsChart({ items }: { items: StatsItem[] }) {
  const [granularity, setGranularity] = useState<Granularity>("week");
  const [view, setView] = useState<"chart" | "table">("chart");
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  const rangeFilteredItems = useMemo(() => {
    if (!rangeStart && !rangeEnd) return items;
    return items.filter((item) => {
      const day = itemDay(item);
      if (!day) return false;
      if (rangeStart && day < rangeStart) return false;
      if (rangeEnd && day > rangeEnd) return false;
      return true;
    });
  }, [items, rangeStart, rangeEnd]);

  const buckets = useMemo(
    () => aggregateByCategory(rangeFilteredItems, granularity),
    [rangeFilteredItems, granularity]
  );
  const activeCategories = useMemo(() => getActiveCategories(buckets), [buckets]);
  const maxTotal = useMemo(
    () => niceMax(Math.max(0, ...buckets.map((b) => b.total))),
    [buckets]
  );

  function showTooltip(e: React.SyntheticEvent, bucket: Bucket, category: string) {
    const containerRect = containerRef.current?.getBoundingClientRect();
    const targetRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-1 rounded-lg bg-neutral-100 p-1 dark:bg-neutral-800">
          {(["week", "day"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGranularity(g)}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                granularity === g
                  ? "bg-white text-neutral-900 shadow-sm dark:bg-neutral-700 dark:text-neutral-100"
                  : "text-neutral-500 dark:text-neutral-400"
              }`}
            >
              {g === "week" ? "주간" : "일별"}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setView(view === "chart" ? "table" : "chart")}
          className="text-sm font-medium text-neutral-500 underline-offset-2 hover:underline dark:text-neutral-400"
        >
          {view === "chart" ? "표로 보기" : "차트로 보기"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <label className="flex items-center gap-1.5 text-neutral-500 dark:text-neutral-400">
          기간
          <input
            type="date"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <span className="text-neutral-400">~</span>
        <input
          type="date"
          value={rangeEnd}
          onChange={(e) => setRangeEnd(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-2 py-1 text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        {(rangeStart || rangeEnd) && (
          <button
            type="button"
            onClick={() => {
              setRangeStart("");
              setRangeEnd("");
            }}
            className="text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
          >
            초기화
          </button>
        )}
      </div>

      <p className="mt-3 text-xs text-neutral-500 dark:text-neutral-400">
        한 글이 여러 그룹에 동시에 속할 수 있어(multi-tag), 막대 합계가 실제 수집 건수보다 클 수
        있습니다.
      </p>

      {buckets.length === 0 ? (
        <p className="mt-6 text-neutral-500 dark:text-neutral-400">데이터가 없습니다.</p>
      ) : view === "table" ? (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[600px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-200 text-left text-neutral-500 dark:border-neutral-800 dark:text-neutral-400">
                <th className="py-2 pr-4 font-medium">
                  {granularity === "week" ? "주차" : "날짜"}
                </th>
                {activeCategories.map((cat) => (
                  <th key={cat} className="py-2 pr-4 font-medium whitespace-nowrap">
                    {cat}
                  </th>
                ))}
                <th className="py-2 font-medium">합계</th>
              </tr>
            </thead>
            <tbody>
              {buckets.map((bucket) => (
                <tr
                  key={bucket.key}
                  className="border-b border-neutral-100 text-neutral-700 dark:border-neutral-900 dark:text-neutral-300"
                >
                  <td className="py-2 pr-4 font-medium text-neutral-900 dark:text-neutral-100">
                    {bucket.label}
                  </td>
                  {activeCategories.map((cat) => (
                    <td key={cat} className="py-2 pr-4 tabular-nums">
                      {bucket.counts[cat] ?? 0}
                    </td>
                  ))}
                  <td className="py-2 font-semibold tabular-nums">{bucket.total}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div ref={containerRef} className="relative mt-6">
          <div className="flex">
            <div
              className="flex flex-col justify-between pr-3 text-xs text-neutral-400 dark:text-neutral-500"
              style={{ height: CHART_HEIGHT }}
            >
              {Array.from({ length: GRID_TICKS + 1 }, (_, i) => (
                <span key={i} className="tabular-nums">
                  {Math.round((maxTotal * (GRID_TICKS - i)) / GRID_TICKS)}
                </span>
              ))}
            </div>

            <div className="relative flex-1 overflow-x-auto">
              <div
                className="absolute inset-0 flex flex-col justify-between"
                aria-hidden
              >
                {Array.from({ length: GRID_TICKS + 1 }, (_, i) => (
                  <div key={i} className="border-t border-neutral-200 dark:border-neutral-800" />
                ))}
              </div>

              <div className="relative flex items-end gap-3" style={{ height: CHART_HEIGHT }}>
                {buckets.map((bucket) => (
                  <div key={bucket.key} className="flex flex-col items-center gap-2">
                    <div
                      className="flex flex-col-reverse overflow-hidden rounded-t"
                      style={{ width: BAR_WIDTH }}
                    >
                      {activeCategories
                        .filter((cat) => (bucket.counts[cat] ?? 0) > 0)
                        .map((cat, i, arr) => {
                          const count = bucket.counts[cat] ?? 0;
                          const height = Math.max((count / maxTotal) * CHART_HEIGHT, 3);
                          const color = getCategoryColor(cat);
                          const isTop = i === arr.length - 1;
                          return (
                            <button
                              key={cat}
                              type="button"
                              onMouseEnter={(e) => showTooltip(e, bucket, cat)}
                              onFocus={(e) => showTooltip(e, bucket, cat)}
                              onMouseLeave={() => setTooltip(null)}
                              onBlur={() => setTooltip(null)}
                              aria-label={`${bucket.label} ${cat} ${count}건`}
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
              <div className="font-semibold">{tooltip.count}건</div>
              <div className="text-neutral-300 dark:text-neutral-600">
                {tooltip.category} · {tooltip.bucketLabel}
              </div>
            </div>
          )}
        </div>
      )}

      {view === "chart" && activeCategories.length > 0 && (
        <ul className="mt-6 flex flex-wrap gap-x-4 gap-y-2 text-xs text-neutral-600 dark:text-neutral-300">
          {activeCategories.map((cat) => (
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
