import type { ClusterPersistence } from "@/lib/stats";
import { pick, t, type Locale } from "@/lib/i18n";

export default function ClusterPersistenceList({
  clusters,
  locale,
}: {
  clusters: ClusterPersistence[];
  locale: Locale;
}) {
  if (clusters.length === 0) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400">
        {t(locale, "statsNoPersistent")}
      </p>
    );
  }

  return (
    <ul className="space-y-2">
      {clusters.map((c) => (
        <li
          key={c.cluster}
          className="flex items-center justify-between gap-3 rounded-lg border border-neutral-200 bg-white px-4 py-3 dark:border-neutral-800 dark:bg-neutral-900"
        >
          <div>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              {pick(locale, c.cluster, c.clusterEn)}
            </p>
            <p className="mt-1 flex flex-wrap gap-1.5 text-xs text-neutral-400 dark:text-neutral-500">
              {c.weeks.map((w) => (
                <span
                  key={w}
                  className="rounded bg-neutral-100 px-1.5 py-0.5 dark:bg-neutral-800"
                >
                  {w}
                </span>
              ))}
            </p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
              {c.weekCount}{t(locale, "statsWeekSuffix")}
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">
              {c.totalItems}{t(locale, "itemsCountSuffix")}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
