"use client";

import { useMemo, useState } from "react";
import type { Item } from "@/lib/types";
import ItemCard from "./ItemCard";

const ALL_TAB = "전체";
const ALL_DATES = "전체";
const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];

function dateKey(item: Item): string | null {
  const ts = item.published_at ?? item.collected_at;
  if (!ts) return null;
  const d = new Date(ts);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function dateLabel(key: string): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${m}/${d}(${WEEKDAYS[date.getUTCDay()]})`;
}

export default function CategoryExplorer({
  items,
  categoryInsights,
}: {
  items: Item[];
  categoryInsights: Record<string, string> | null;
}) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState(ALL_TAB);
  const [selectedDate, setSelectedDate] = useState(ALL_DATES);

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

  const dateCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const item of tabItems) {
      const key = dateKey(item);
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return counts;
  }, [tabItems]);

  const dateKeys = [...dateCounts.keys()].sort();

  const dateFilteredItems = useMemo(() => {
    if (selectedDate === ALL_DATES) return tabItems;
    return tabItems.filter((item) => dateKey(item) === selectedDate);
  }, [tabItems, selectedDate]);

  const filteredItems = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return dateFilteredItems;
    return dateFilteredItems.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.summary ?? "").toLowerCase().includes(q)
    );
  }, [dateFilteredItems, query]);

  const clusters = useMemo(() => {
    const groups = new Map<string, Item[]>();
    for (const item of filteredItems) {
      const key = item.cluster ?? "미분류";
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(item);
    }
    return groups;
  }, [filteredItems]);

  const activeInsight = activeTab !== ALL_TAB ? categoryInsights?.[activeTab] : null;

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3 dark:border-neutral-800">
        {tabs.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setSelectedDate(ALL_DATES);
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

      {dateKeys.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {[ALL_DATES, ...dateKeys].map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setSelectedDate(key)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedDate === key
                  ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                  : "text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
              }`}
            >
              {key === ALL_DATES ? ALL_DATES : dateLabel(key)}
              {key !== ALL_DATES && (
                <span className="ml-1 opacity-70">{dateCounts.get(key)}</span>
              )}
            </button>
          ))}
        </div>
      )}

      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="제목·요약 검색..."
        className="mt-4 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {activeInsight && (
        <p className="mt-4 rounded-lg bg-indigo-50/60 px-4 py-3 text-sm leading-relaxed text-neutral-700 dark:bg-indigo-950/30 dark:text-neutral-300">
          {activeInsight}
        </p>
      )}

      <div className="mt-6 space-y-8">
        {[...clusters.entries()].map(([cluster, clusterItems]) => (
          <section key={cluster}>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-neutral-700 dark:text-neutral-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-400" />
              {cluster}
              <span className="font-normal text-neutral-400 dark:text-neutral-500">
                {clusterItems.length}건
              </span>
            </h3>
            <div className="mt-3 space-y-3">
              {clusterItems.map((item) => (
                <ItemCard key={item.id} item={item} />
              ))}
            </div>
          </section>
        ))}

        {filteredItems.length === 0 && (
          <p className="text-neutral-500 dark:text-neutral-400">검색 결과가 없습니다.</p>
        )}
      </div>
    </div>
  );
}
