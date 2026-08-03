import type { ReactNode } from "react";
import type { Item } from "@/lib/types";
import BulletList, { parseBulletLines } from "./BulletList";
import CopyButton from "./CopyButton";
import AnthropicIcon from "./icons/AnthropicIcon";
import BingIcon from "./icons/BingIcon";
import GoogleIcon from "./icons/GoogleIcon";
import OpenAiIcon from "./icons/OpenAiIcon";
import RedditIcon from "./icons/RedditIcon";
import { getScoreBand } from "@/lib/score";

/** 소스명으로 키를 잡는다 - 로고가 단순·인지도 높은 몇 개(원출처 신호가 큰 곳들)만 넣고
 * 나머지는 "공식/매체" 텍스트 배지로 충분하다고 판단해 일부러 안 넣음 (아이콘 난립 방지).
 * 새로 추가하고 싶은 소스가 생기면 여기 항목만 추가하면 됨. */
const SOURCE_ICONS: Record<string, ReactNode> = {
  "Reddit r/SEO": <RedditIcon />,
  "Google Search Central Blog": <GoogleIcon />,
  "Google Search Product Blog": <GoogleIcon />,
  "OpenAI News": <OpenAiIcon />,
  "Anthropic News": <AnthropicIcon />,
  "Bing Webmaster Blog": <BingIcon />,
};

/** 공식/매체는 "기본값"이라 눈에 덜 띄는 회색으로, 커뮤니티(검증 안 된 개인 의견)만
 * amber로 튀게 - 셋 다 색을 강하게 주면 카드 왼쪽 테두리(관련도 점수)랑 헷갈림. */
const SOURCE_TYPE_LABELS: Record<string, { label: string; className: string }> = {
  official: {
    label: "공식",
    className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  trade: {
    label: "매체",
    className: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400",
  },
  community: {
    label: "커뮤니티",
    className: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  },
};

export function formatDate(ts: string | null): string {
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

/** 클라이언트 자료에 바로 붙여넣기 좋은 형태로 정리 (제목 → 요약 불릿 → 시사점 → 출처). */
function buildCopyText(item: Item): string {
  const lines = [item.title];
  if (item.summary) {
    lines.push(...parseBulletLines(item.summary).map((line) => `- ${line}`));
  }
  if (item.insight) {
    lines.push(`→ ${item.insight}`);
  }
  lines.push(`(출처: ${item.source ?? "출처 미상"}, ${item.url})`);
  return lines.join("\n");
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
      <div className="mt-1.5 flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-xs text-neutral-500 dark:text-neutral-400">
          {item.source && SOURCE_ICONS[item.source]}
          {item.source ?? "출처 미상"}
          {item.source_type && SOURCE_TYPE_LABELS[item.source_type] && (
            <span
              className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${SOURCE_TYPE_LABELS[item.source_type].className}`}
            >
              {SOURCE_TYPE_LABELS[item.source_type].label}
            </span>
          )}
          <span>· {formatDate(item.published_at ?? item.collected_at)}</span>
        </p>
        <CopyButton text={buildCopyText(item)} />
      </div>
      {item.summary && (
        <>
          <BulletList
            text={item.summary}
            className="mt-2.5 text-sm leading-relaxed text-neutral-700 dark:text-neutral-300"
          />
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-block text-xs text-neutral-400 underline-offset-2 hover:text-neutral-600 hover:underline dark:text-neutral-500 dark:hover:text-neutral-300"
          >
            {item.source ?? "출처 미상"}에서 원문 보기 ↗
          </a>
        </>
      )}
    </article>
  );
}
