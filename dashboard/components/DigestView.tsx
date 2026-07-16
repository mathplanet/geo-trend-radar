import { getItemsForWeek, groupByCluster } from "@/lib/queries";
import type { Digest } from "@/lib/types";
import ItemCard from "./ItemCard";

export default async function DigestView({ digest }: { digest: Digest }) {
  const items = await getItemsForWeek(digest.week);
  const headlineIds = new Set(digest.headline_items ?? []);
  const headlineItems = items.filter((item) => headlineIds.has(item.id));
  const clusters = groupByCluster(items);

  return (
    <div className="space-y-10">
      <section>
        <h1 className="text-2xl font-bold">{digest.week} 다이제스트</h1>
        {digest.overview && (
          <p className="mt-3 whitespace-pre-line text-neutral-700">
            {digest.overview}
          </p>
        )}
      </section>

      {headlineItems.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-neutral-800">
            이번 주 헤드라인
          </h2>
          <ul className="mt-3 space-y-3">
            {headlineItems.map((item) => (
              <li
                key={item.id}
                className="rounded-lg border border-neutral-200 bg-white p-4"
              >
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium hover:underline"
                >
                  {item.title}
                </a>
                {item.insight && (
                  <p className="mt-1 text-sm text-neutral-600">
                    {item.insight}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {[...clusters.entries()].map(([cluster, clusterItems]) => (
        <section key={cluster}>
          <h2 className="text-lg font-semibold text-neutral-800">
            {cluster}
          </h2>
          <div className="mt-3 space-y-3">
            {clusterItems.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      ))}

      {items.length === 0 && (
        <p className="text-neutral-500">이번 주 수집된 글이 없습니다.</p>
      )}
    </div>
  );
}
