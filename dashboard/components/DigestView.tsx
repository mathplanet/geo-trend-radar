import { formatWeekRange, getItemsForWeek } from "@/lib/queries";
import { SCORE_EXPLANATION, getScoreBand } from "@/lib/score";
import type { Digest } from "@/lib/types";
import BulletList from "./BulletList";
import CategoryExplorer from "./CategoryExplorer";
import InfoTooltip from "./InfoTooltip";

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

        {digest.overview && (
          <blockquote className="mt-4 rounded-lg border-l-4 border-indigo-400 bg-indigo-50/60 px-4 py-3 dark:border-indigo-500 dark:bg-indigo-950/30">
            <BulletList
              text={digest.overview}
              className="text-[15px] leading-relaxed text-neutral-800 dark:text-neutral-200"
            />
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
