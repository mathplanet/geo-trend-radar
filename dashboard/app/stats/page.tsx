import KeywordTrendTable from "@/components/KeywordTrendTable";
import SourceStatsTable from "@/components/SourceStatsTable";
import StatsChart from "@/components/StatsChart";
import { getAllItemsForStats } from "@/lib/queries";
import { aggregateBySource, aggregateKeywordTrend } from "@/lib/stats";

export default async function StatsPage() {
  const items = await getAllItemsForStats();
  const sourceStats = aggregateBySource(items);
  const keywordTrend = aggregateKeywordTrend(items);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        수집 현황
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        주차별·일자별로 그룹(카테고리)마다 몇 건이 수집됐는지 확인합니다.
      </p>
      <div className="mt-8">
        <StatsChart items={items} />
      </div>

      <section className="mt-12">
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

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          키워드 트렌드
        </h2>
        <p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">
          이번 주 가장 많이 매칭된 키워드와, 직전 주 대비 증감입니다.
        </p>
        <div className="mt-4">
          <KeywordTrendTable trend={keywordTrend} />
        </div>
      </section>
    </div>
  );
}
