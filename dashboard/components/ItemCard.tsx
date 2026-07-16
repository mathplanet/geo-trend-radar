import type { Item } from "@/lib/types";

function formatDate(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ItemCard({ item }: { item: Item }) {
  return (
    <article className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-neutral-900 hover:underline"
        >
          {item.title}
        </a>
        <span className="shrink-0 rounded bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
          점수 {item.relevance_score ?? "-"}
        </span>
      </div>
      <p className="mt-1 text-xs text-neutral-500">
        {item.source ?? "출처 미상"} · {formatDate(item.published_at)}
      </p>
      {item.summary && (
        <p className="mt-2 whitespace-pre-line text-sm text-neutral-700">
          {item.summary}
        </p>
      )}
    </article>
  );
}
