"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { itemWeekLabel } from "@/lib/stats";
import type { Item } from "@/lib/types";
import ItemCard from "./ItemCard";

export default function GlobalSearch({ items }: { items: Item[] }) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        (item.summary ?? "").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="전체 기간에서 제목·요약 검색..."
        autoFocus
        className="w-full rounded-lg border border-neutral-300 bg-white px-4 py-3 text-base text-neutral-900 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
      />

      {query.trim() === "" ? (
        <p className="mt-6 text-neutral-500 dark:text-neutral-400">
          검색어를 입력하면 전체 기간의 글을 찾습니다.
        </p>
      ) : results.length === 0 ? (
        <p className="mt-6 text-neutral-500 dark:text-neutral-400">검색 결과가 없습니다.</p>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            {results.length}건
          </p>
          {results.map((item) => {
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
        </div>
      )}
    </div>
  );
}
