"use client";

import { useMemo, useState } from "react";
import {
  aggregateBySource,
  aggregateClusterPersistence,
  aggregateKeywordTrend,
  itemWeekLabel,
  type StatsItem,
} from "@/lib/stats";
import ClusterPersistenceList from "./ClusterPersistenceList";
import KeywordTrendTable from "./KeywordTrendTable";
import SourceStatsTable from "./SourceStatsTable";

const ALL = "전체";

export default function StatsExplorer({ items }: { items: StatsItem[] }) {
  const [selected, setSelected] = useState<string>(ALL);

  const weeks = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      const week = itemWeekLabel(item);
      if (week) set.add(week);
    }
    return [...set].sort().reverse();
  }, [items]);

  // 소스별 통계는 선택한 주차만 딱 잘라서 본다 (그 주에 각 소스가 얼마나 기여했는지).
  const sourceItems = useMemo(() => {
    if (selected === ALL) return items;
    return items.filter((item) => itemWeekLabel(item) === selected);
  }, [items, selected]);

  // 키워드 트렌드·클러스터 지속성은 둘 다 "선택한 주차까지 누적"으로 봐야 의미가 있다
  // (키워드 트렌드는 선택 주 vs 그 직전 주 비교, 지속성은 여러 주에 걸친 반복 등장 여부).
  const cumulativeItems = useMemo(() => {
    if (selected === ALL) return items;
    return items.filter((item) => {
      const week = itemWeekLabel(item);
      return week !== null && week <= selected;
    });
  }, [items, selected]);

  const sourceStats = useMemo(() => aggregateBySource(sourceItems), [sourceItems]);
  const keywordTrend = useMemo(() => aggregateKeywordTrend(cumulativeItems), [cumulativeItems]);
  const persistentClusters = useMemo(
    () => aggregateClusterPersistence(cumulativeItems),
    [cumulativeItems]
  );

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[160px_minmax(0,1fr)]">
      <aside>
        <h3 className="text-xs font-semibold tracking-wide text-neutral-400 uppercase dark:text-neutral-500">
          기간
        </h3>
        <ul className="mt-2 flex gap-1 overflow-x-auto lg:mt-3 lg:flex-col lg:overflow-visible">
          {[ALL, ...weeks].map((week) => {
            const active = week === selected;
            return (
              <li key={week} className="shrink-0">
                <button
                  type="button"
                  onClick={() => setSelected(week)}
                  className={`block w-full rounded-md px-2 py-1.5 text-left text-sm whitespace-nowrap transition-colors ${
                    active
                      ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300"
                      : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
                  }`}
                >
                  {week}
                </button>
              </li>
            );
          })}
        </ul>
      </aside>

      <div className="min-w-0 space-y-12">
        <section>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            소스별 통계
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            노이즈 비율은 Claude가 주간 배치에서 &ldquo;관련 없음&rdquo;으로 재평가한 글의
            비중입니다. 높을수록 그 소스의 threshold를 다시 볼 필요가 있다는 신호예요.
          </p>
          <div className="mt-4">
            <SourceStatsTable stats={sourceStats} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            키워드 트렌드
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            선택한 주차 기준 상위 키워드와, 직전 주 대비 증감입니다.
          </p>
          <div className="mt-4">
            <KeywordTrendTable trend={keywordTrend} />
          </div>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
            지속되는 주제
          </h2>
          <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
            선택한 주차까지 2주 이상 반복 등장한 세부 주제(클러스터)입니다. 클러스터명은
            매주 Claude가 그 주 글만 보고 새로 짓기 때문에, 같은 주제라도 표현이 달라지면
            다른 주제로 잡힐 수 있어요(참고용 지표).
          </p>
          <div className="mt-4">
            <ClusterPersistenceList clusters={persistentClusters} />
          </div>
        </section>
      </div>
    </div>
  );
}
