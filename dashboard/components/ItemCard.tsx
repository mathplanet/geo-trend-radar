import type { Item } from "@/lib/types";
import { getScoreBand } from "@/lib/score";

function formatDate(ts: string | null): string {
  if (!ts) return "-";
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export default function ItemCard({ item }: { item: Item }) {
  const band = getScoreBand(item.relevance_score);

  return (
    <article className="group rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 dark:bg-neutral-900">
      <div className="flex items-start justify-between gap-3">
        <a
          href={item.url}
          target="_blank"
          rel="noreferrer"
          className="font-semibold leading-snug text-neutral-900 underline-offset-2 group-hover:underline dark:text-neutral-100"
        >
          {item.title}
        </a>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${band.badgeClass}`}
          title={`관련도 점수 ${item.relevance_score ?? "-"} — ${band.label}. 제목·요약에 매칭된 GEO/SEO 키워드 가중치의 합계입니다.`}
        >
          {band.label} · {item.relevance_score ?? "-"}
        </span>
      </div>
      <p className="mt-1.5 text-xs text-neutral-500 dark:text-neutral-400">
        {item.source ?? "출처 미상"} · {formatDate(item.published_at)}
      </p>
      {item.summary && (
        <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">
          {item.summary}
        </p>
      )}
    </article>
  );
}
