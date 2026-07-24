import type { ClusterPersistence } from "@/lib/stats";

export default function ClusterPersistenceList({
  clusters,
}: {
  clusters: ClusterPersistence[];
}) {
  if (clusters.length === 0) {
    return (
      <p className="text-neutral-500 dark:text-neutral-400">
        아직 2주 이상 이어지는 주제가 없습니다.
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
            <p className="font-medium text-neutral-900 dark:text-neutral-100">{c.cluster}</p>
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
              {c.weekCount}주
            </p>
            <p className="text-xs text-neutral-400 dark:text-neutral-500">{c.totalItems}건</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
