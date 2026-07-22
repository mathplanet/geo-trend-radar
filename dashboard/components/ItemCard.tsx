import type { Item } from "@/lib/types";
import BulletList from "./BulletList";
import { getScoreBand } from "@/lib/score";

function formatDate(ts: string | null): string {
  if (!ts) return "-";
  // timeZone을 명시하지 않으면 서버(빌드 시점)와 브라우저(사용자 로컬)가 서로 다른
  // 타임존으로 계산해 결과 문자열이 달라져 하이드레이션 불일치(React #418)가 났었음.
  return new Date(ts).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  });
}

export default function ItemCard({ item }: { item: Item }) {
  const band = getScoreBand(item.relevance_score);

  return (
    <article
      className={`group rounded-xl border border-l-4 border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md dark:border-neutral-800 ${band.borderClass} dark:bg-neutral-900`}
    >
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
        {item.source ?? "출처 미상"} · {formatDate(item.published_at ?? item.collected_at)}
      </p>
      {item.summary && (
        <BulletList
          text={item.summary}
          className="mt-2.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
        />
      )}
    </article>
  );
}
