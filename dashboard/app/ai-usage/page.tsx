import AiUsageChart from "@/components/AiUsageChart";
import { aggregateUsageByWeek, providerLabel } from "@/lib/aiUsage";
import { formatWeekRange, getActiveModels, getAiUsageTrend } from "@/lib/queries";
import type { ActiveModel } from "@/lib/types";

function formatReleaseDate(ts: string | null): string {
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

function groupByProvider(models: ActiveModel[]): Map<string, ActiveModel[]> {
  const byProvider = new Map<string, ActiveModel[]>();
  for (const model of models) {
    const list = byProvider.get(model.provider) ?? [];
    list.push(model);
    byProvider.set(model.provider, list);
  }
  return byProvider;
}

export default async function AiUsagePage() {
  const [usageRows, activeModels] = await Promise.all([getAiUsageTrend(), getActiveModels()]);
  const buckets = aggregateUsageByWeek(usageRows).map((bucket) => ({
    ...bucket,
    label: formatWeekRange(bucket.week),
  }));
  const byProvider = groupByProvider(activeModels);

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
        AI 서비스
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        OpenRouter 경유 트래픽 기준 provider별 주간 사용 비중과, 현재 서비스 중인 모델
        목록입니다 (매주 1회 갱신 - 소비자 웹 트래픽이 아니라 개발자 API 사용량 기준이라는
        점 참고).
      </p>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          주간 사용 비중 추이
        </h2>
        <div className="mt-4">
          <AiUsageChart buckets={buckets} />
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-50">
          현재 서비스 중인 모델
        </h2>
        {byProvider.size === 0 ? (
          <p className="mt-4 text-neutral-500 dark:text-neutral-400">
            아직 수집된 데이터가 없습니다.
          </p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...byProvider.entries()].map(([provider, models]) => (
              <div
                key={provider}
                className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <h3 className="text-sm font-semibold text-neutral-700 dark:text-neutral-300">
                  {providerLabel(provider)}
                </h3>
                <ul className="mt-2 space-y-1.5 text-sm text-neutral-600 dark:text-neutral-300">
                  {models.map((m) => (
                    <li key={m.model_id} className="flex items-center justify-between gap-2">
                      <span>{m.name}</span>
                      <span className="shrink-0 text-xs text-neutral-400 dark:text-neutral-500">
                        {formatReleaseDate(m.released_at)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
