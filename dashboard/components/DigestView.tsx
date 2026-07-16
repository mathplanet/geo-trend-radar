import { getItemsForWeek, groupByCluster } from "@/lib/queries";
import { SCORE_EXPLANATION, getScoreBand } from "@/lib/score";
import type { Digest } from "@/lib/types";
import InfoTooltip from "./InfoTooltip";
import ItemCard from "./ItemCard";

const LEGEND_SCORES = [9, 6, 3];

export default async function DigestView({
  digest,
  isLatest = false,
}: {
  digest: Digest;
  isLatest?: boolean;
}) {
  const items = await getItemsForWeek(digest.week);
  const headlineIds = new Set(digest.headline_items ?? []);
  const headlineItems = items.filter((item) => headlineIds.has(item.id));
  const clusters = groupByCluster(items);

  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {digest.week} 다이제스트
          </h1>
          {isLatest && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              최신
            </span>
          )}
        </div>

        {digest.overview && (
          <blockquote className="mt-4 rounded-lg border-l-4 border-indigo-400 bg-indigo-50/60 px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line text-neutral-800 dark:border-indigo-500 dark:bg-indigo-950/30 dark:text-neutral-200">
            {digest.overview}
          </blockquote>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          <InfoTooltip label="점수는 무슨 뜻?">{SCORE_EXPLANATION}</InfoTooltip>
          {LEGEND_SCORES.map((score) => {
            const band = getScoreBand(score);
            return (
              <span
                key={score}
                className={`rounded-full px-2 py-0.5 font-medium ${band.badgeClass}`}
              >
                {band.label}
              </span>
            );
          })}
        </div>
      </section>

      {headlineItems.length > 0 && (
        <section>
          <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">
            이번 주 헤드라인
          </h2>
          <ol className="mt-3 space-y-3">
            {headlineItems.map((item, index) => (
              <li
                key={item.id}
                className="flex gap-3 rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-xs font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
                  {index + 1}
                </span>
                <div>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-neutral-900 underline-offset-2 hover:underline dark:text-neutral-100"
                  >
                    {item.title}
                  </a>
                  {item.insight && (
                    <p className="mt-1 text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
                      {item.insight}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      )}

      {[...clusters.entries()].map(([cluster, clusterItems]) => (
        <section key={cluster}>
          <h2 className="flex items-center gap-2 text-base font-semibold text-neutral-900 dark:text-neutral-100">
            <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-400" />
            {cluster}
            <span className="font-normal text-neutral-400 dark:text-neutral-500">
              {clusterItems.length}건
            </span>
          </h2>
          <div className="mt-3 space-y-3">
            {clusterItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      {items.length === 0 && (
        <p className="text-neutral-500 dark:text-neutral-400">
          이번 주 수집된 글이 없습니다.
        </p>
      )}
    </div>
  );
}
