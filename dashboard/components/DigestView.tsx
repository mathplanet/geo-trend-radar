import { formatWeekRange, getItemsForWeek } from "@/lib/queries";
import { SCORE_EXPLANATION, getScoreBand } from "@/lib/score";
import type { Digest } from "@/lib/types";
import BulletList from "./BulletList";
import CategoryExplorer from "./CategoryExplorer";
import InfoTooltip from "./InfoTooltip";
import { formatDate } from "./ItemCard";

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
  const itemsById = new Map(items.map((item) => [item.id, item]));

  return (
    <div className="space-y-12">
      <section>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50">
            {digest.week} 다이제스트
          </h1>
          <span className="text-sm font-medium text-neutral-400 dark:text-neutral-500">
            ({formatWeekRange(digest.week)})
          </span>
          {isLatest && (
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              최신
            </span>
          )}
        </div>

        {digest.theme && (
          <p className="mt-3 text-lg leading-snug font-medium text-neutral-700 italic dark:text-neutral-300">
            {digest.theme}
          </p>
        )}

        {digest.overview_points && digest.overview_points.length > 0 ? (
          <div className="mt-4">
            <h2 className="text-sm font-semibold text-neutral-500 dark:text-neutral-400">
              이번 주 꼭 알아야 할 사항
            </h2>
            <blockquote className="mt-2 rounded-lg border-l-4 border-indigo-400 bg-indigo-50/60 px-4 py-3 dark:border-indigo-500 dark:bg-indigo-950/30">
              <ul className="space-y-1.5 text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200">
                {digest.overview_points.map((point, i) => {
                  const sources = point.item_ids
                    .map((id) => itemsById.get(id))
                    .filter((item): item is NonNullable<typeof item> => !!item);
                  return (
                    <li key={i} className="flex gap-1.5">
                      <span className="mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-500">
                        •
                      </span>
                      <span>
                        {point.text}
                        {sources.length > 0 && (
                          <span className="ml-1.5 inline-flex flex-wrap gap-1 align-middle">
                            {sources.map((item) => (
                              <a
                                key={item.id}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                title={item.title}
                                className="rounded bg-indigo-100 px-1.5 py-0.5 text-xs font-medium text-indigo-700 hover:bg-indigo-200 dark:bg-indigo-950 dark:text-indigo-300 dark:hover:bg-indigo-900"
                              >
                                {item.source ?? "출처"}
                              </a>
                            ))}
                          </span>
                        )}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </blockquote>
          </div>
        ) : (
          // overview_points가 없는(빈 배열 또는 예전 방식) 주. digest.overview는 예전
          // theme+overview_points 방식으로 만들어진 주차에서만 값이 남아있는 폴백 표시.
          digest.overview && (
            <blockquote className="mt-4 rounded-lg border-l-4 border-indigo-400 bg-indigo-50/60 px-4 py-3 dark:border-indigo-500 dark:bg-indigo-950/30">
              <BulletList
                text={digest.overview}
                className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200"
              />
            </blockquote>
          )
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
                  <p className="mt-0.5 text-xs text-neutral-400 dark:text-neutral-500">
                    {item.source ?? "출처 미상"} ·{" "}
                    {formatDate(item.published_at ?? item.collected_at)}
                  </p>
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

      {items.length > 0 ? (
        <section>
          <CategoryExplorer items={items} categoryInsights={digest.category_insights} />
        </section>
      ) : (
        <p className="text-neutral-500 dark:text-neutral-400">
          이번 주 수집된 글이 없습니다.
        </p>
      )}
    </div>
  );
}
