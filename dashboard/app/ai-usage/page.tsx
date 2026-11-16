import ActiveModelsList from "@/components/ActiveModelsList";
import AiUsageChart from "@/components/AiUsageChart";
import { aggregateUsageByWeek } from "@/lib/aiUsage";
import { t } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";
import { formatWeekRange, getActiveModels, getAiUsageTrend } from "@/lib/queries";

export default async function AiUsagePage() {
  const [usageRows, activeModels, locale] = await Promise.all([
    getAiUsageTrend(),
    getActiveModels(),
    getLocale(),
  ]);
  const buckets = aggregateUsageByWeek(usageRows).map((bucket) => ({
    ...bucket,
    label: formatWeekRange(bucket.week),
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        {t(locale, "aiUsageTitle")}
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        {locale === "en"
          ? "Weekly share of OpenRouter-routed traffic by provider, plus the models currently in service (updated weekly - developer API usage, not consumer web traffic)."
          : "OpenRouter 경유 트래픽 기준 provider별 주간 사용 비중과, 현재 서비스 중인 모델 목록입니다 (매주 1회 갱신 - 소비자 웹 트래픽이 아니라 개발자 API 사용량 기준이라는 점 참고)."}
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {locale === "en" ? "Weekly Usage Share Trend" : "주간 사용 비중 추이"}
        </h2>
        <div className="mt-4">
          <AiUsageChart buckets={buckets} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          {locale === "en" ? "Models Currently in Service" : "현재 서비스 중인 모델"}
        </h2>
        <p className="mt-1 text-xs text-neutral-400 dark:text-neutral-500">
          {locale === "en"
            ? "Click a model to see details like context length and pricing."
            : "모델을 클릭하면 컨텍스트 길이·가격 등 상세 정보를 볼 수 있습니다."}
        </p>
        <div className="mt-4">
          <ActiveModelsList models={activeModels} />
        </div>
      </section>
    </div>
  );
}
