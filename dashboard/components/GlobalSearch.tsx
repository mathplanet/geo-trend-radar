"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { itemWeekLabel } from "@/lib/stats";
import type { Item } from "@/lib/types";
import ItemCard from "./ItemCard";

const ALL_TAB = "전체";
const PAGE_SIZE = 10;

/** 페이지 번호를 앞/뒤/현재 주변만 남기고 나머지는 "…"로 접는다 (7페이지 이하면 그대로 전부). */
function getPageNumbers(current: number, total: number): (number | "…")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push("…");
    result.push(p);
    prev = p;
  }
  return result;
}

function dateKey(item: Item): string | null {
  const ts = item.published_at ?? item.collected_at;
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

export default function GlobalSearch({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(ALL_TAB);
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd] = useState("");

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of items) {
      for (const category of item.categories ?? []) {
        counts.set(category, (counts.get(category) ?? 0) + 1);
      }
    }
    return counts;
  }, [items]);

  const tabs = [ALL_TAB, ...[...categoryCounts.keys()].sort()];

  const tabItems = useMemo(() => {
    if (activeTab === ALL_TAB) return items;
    return items.filter((item) => (item.categories ?? []).includes(activeTab));
  }, [items, activeTab]);

  const rangeFilteredItems = useMemo(() => {
    if (!rangeStart && !rangeEnd) return tabItems;
    return tabItems.filter((item) => {
      const key = dateKey(item);
      if (!key) return false;
      if (rangeStart && key < rangeStart) return false;
      if (rangeEnd && key > rangeEnd) return false;
      return true;
    });
  }, [tabItems, rangeStart, rangeEnd]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rangeFilteredItems;
    return rangeFilteredItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.summary ?? "").toLowerCase().includes(q)
    );
  }, [rangeFilteredItems, query]);

  const [page, setPage] = useState(1);

  // 검색어/탭/기간이 바뀌면 이전 필터 기준으로 보던 페이지 번호가 무의미해지니 1페이지로.
  // useEffect 대신 렌더 중 조정하는 React 권장 패턴(리렌더 캐스케이드 없이 즉시 반영).
  const filterKey = `${query}|${activeTab}|${rangeStart}|${rangeEnd}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey);
    setPage(1);
  }

  const totalPages = Math.max(1, Math.ceil(results.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedResults = results.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목·요약 검색..."
        autoFocus
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      <div className="mt-4 flex flex-wrap gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setRangeStart("");
              setRangeEnd("");
            }}
            className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-300 dark:hover:bg-neutral-700"
            }`}
          >
            {tab}
            {tab !== ALL_TAB && (
              <span className="ml-1.5 opacity-70">{categoryCounts.get(tab)}</span>
            )}
          </button>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          기간
          <input
            type="date"
            value={rangeStart}
            onChange={(e) => setRangeStart(e.target.value)}
            className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
        </label>
        <span className="text-xs text-neutral-400">~</span>
        <input
          type="date"
          value={rangeEnd}
          onChange={(e) => setRangeEnd(e.target.value)}
          className="rounded-md border border-neutral-300 bg-white px-1.5 py-0.5 text-xs text-neutral-900 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
        />
        {(rangeStart || rangeEnd) && (
          <button
            type="button"
            onClick={() => {
              setRangeStart("");
              setRangeEnd("");
            }}
            className="text-xs text-neutral-400 underline-offset-2 hover:underline dark:text-neutral-500"
          >
            초기화
          </button>
        )}
      </div>

      {results.length === 0 ? (
        <p className="mt-6 text-neutral-500 dark:text-neutral-400">검색 결과가 없습니다.</p>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {results.length}건
          </p>
          {pagedResults.map((item) => {
            const week = itemWeekLabel(item);
            return (
              <div key={item.id}>
                {week && (
                  <Link
                    href={`/${week}`}
                    className="mb-1.5 inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
                  >
                    {week}
                  </Link>
                )}
                <ItemCard item={item} />
              </div>
            );
          })}

          {totalPages > 1 && (
            <nav className="flex items-center justify-center gap-1 pt-4">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-md px-2.5 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-neutral-400 dark:hover:bg-neutral-800"
                aria-label="이전 페이지"
              >
                ‹
              </button>
              {getPageNumbers(currentPage, totalPages).map((p, i) =>
                p === "…" ? (
                  <span
                    key={`ellipsis-${i}`}
                    className="px-1.5 text-sm text-neutral-400 dark:text-neutral-500"
                  >
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium tabular-nums transition-colors ${
                      p === currentPage
                        ? "bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900"
                        : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-md px-2.5 py-1.5 text-sm text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 disabled:hover:bg-transparent dark:text-neutral-400 dark:hover:bg-neutral-800"
                aria-label="다음 페이지"
              >
                ›
              </button>
            </nav>
          )}
        </div>
      )}
    </div>
  );
}
