"use client";

import { useState } from "react";
import { providerLabel } from "@/lib/aiUsage";
import type { ActiveModel } from "@/lib/types";

function formatDate(ts: string | null): string {
  if (!ts) return "";
  // ItemCard.tsx와 동일한 이유로 timeZone 명시 (서버/클라이언트 타임존 차이로 인한
  // 하이드레이션 불일치 방지, React #418).
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

function formatPrice(perToken: string | null): string {
  if (!perToken) return "-";
  const value = Number(perToken) * 1_000_000;
  if (value === 0) return "무료";
  return `$${value < 1 ? value.toFixed(3) : value.toFixed(2)} / 1M 토큰`;
}

function formatModality(modality: string | null): string {
  if (!modality) return "-";
  const [input, output] = modality.split("->");
  return `${input?.replaceAll("+", " + ")} 입력 → ${output?.replaceAll("+", " + ")} 출력`;
}

function groupByProvider(models: ActiveModel[]): Map<string, ActiveModel[]> {
  const byProvider = new Map<string, ActiveModel[]>();
  for (const model of models) {
    const list = byProvider.get(model.provider) ?? [];
    list.push(model);
    byProvider.set(model.provider, list);
  }
  return byProvider;
}

export default function ActiveModelsList({ models }: { models: ActiveModel[] }) {
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const byProvider = groupByProvider(models);

  if (byProvider.size === 0) {
    return <p className="text-neutral-500 dark:text-neutral-400">아직 수집된 데이터가 없습니다.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {[...byProvider.entries()].map(([provider, providerModels]) => (
        <div
          key={provider}
          className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
            {providerLabel(provider)}
          </h3>
          <ul className="mt-2 space-y-1 text-sm text-neutral-600 dark:text-neutral-300">
            {providerModels.map((m) => {
              const expanded = expandedId === m.id;
              const d = m.details;
              return (
                <li key={m.model_id}>
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : m.id)}
                    className="flex w-full items-center justify-between gap-2 rounded px-1 py-1 text-left hover:bg-neutral-50 dark:hover:bg-neutral-800"
                  >
                    <span>{m.name}</span>
                    <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                      {formatDate(m.released_at)}
                    </span>
                  </button>
                  {expanded && d && (
                    <dl className="ml-1 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-md bg-neutral-50 px-3 py-2 text-xs text-neutral-500 dark:bg-neutral-800/60 dark:text-neutral-400">
                      <dt className="font-medium text-neutral-400 dark:text-neutral-500">
                        컨텍스트
                      </dt>
                      <dd>
                        {d.context_length ? `${(d.context_length / 1000).toLocaleString()}K 토큰` : "-"}
                      </dd>
                      <dt className="font-medium text-neutral-400 dark:text-neutral-500">가격</dt>
                      <dd>
                        입력 {formatPrice(d.pricing.prompt)} · 출력 {formatPrice(d.pricing.completion)}
                      </dd>
                      <dt className="font-medium text-neutral-400 dark:text-neutral-500">입출력</dt>
                      <dd>{formatModality(d.modality)}</dd>
                      <dt className="font-medium text-neutral-400 dark:text-neutral-500">
                        지식 기준일
                      </dt>
                      <dd>{d.knowledge_cutoff ?? "미공개"}</dd>
                      <dt className="font-medium text-neutral-400 dark:text-neutral-500">추론 모드</dt>
                      <dd>{d.reasoning_supported ? "지원" : "미지원"}</dd>
                    </dl>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
