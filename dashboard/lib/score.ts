import type { Locale } from "./i18n";

export type ScoreBand = {
  label: string;
  badgeClass: string;
  borderClass: string;
};

const LABELS: Record<Locale, [string, string, string]> = {
  ko: ["매우 높음", "높음", "보통"],
  en: ["Very High", "High", "Moderate"],
};

/** keywords.yaml의 가중치 합산 점수를 사람이 읽을 수 있는 등급으로 변환.
 * 경계값은 관측된 실제 분포(3~11)를 기준으로 잡은 것이라 데이터가 쌓이면 조정 가능. */
export function getScoreBand(score: number | null, locale: Locale = "ko"): ScoreBand {
  const value = score ?? 0;
  const [veryHigh, high, moderate] = LABELS[locale];
  if (value >= 8) {
    return {
      label: veryHigh,
      badgeClass: "bg-indigo-600 text-white dark:bg-indigo-500",
      borderClass: "border-l-indigo-600 dark:border-l-indigo-400",
    };
  }
  if (value >= 5) {
    return {
      label: high,
      badgeClass:
        "bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300",
      borderClass: "border-l-indigo-300 dark:border-l-indigo-700",
    };
  }
  return {
    label: moderate,
    badgeClass:
      "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-300",
    borderClass: "border-l-neutral-200 dark:border-l-neutral-700",
  };
}

export const SCORE_EXPLANATION: Record<Locale, string> = {
  ko: "제목·요약에 매칭된 GEO/SEO 키워드 가중치의 합계입니다. 높을수록 이번 주 트렌드와의 관련성이 강하다는 뜻이에요.",
  en: "The sum of matched GEO/SEO keyword weights in the title and summary. Higher means stronger relevance to this week's trends.",
};
