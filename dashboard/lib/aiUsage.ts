import { CATEGORY_COLORS, OTHER_COLOR } from "./stats";
import type { AiUsageRow } from "./types";

/** src/collect_ai_usage.py의 TRACKED_PROVIDERS와 동일한 provider 집합으로 맞출 것
 * (한쪽만 고치면 라벨이 안 맞거나 데이터가 "기타"로 묻힌다). 색상 슬롯을 고정 배정하기
 * 위한 순서 - CATEGORY_ORDER(stats.ts)와 같은 이유. */
export const PROVIDER_ORDER = [
  "Anthropic (Claude)",
  "OpenAI (GPT)",
  "Google (Gemini)",
  "xAI (Grok)",
  "Meta (Llama)",
  "Mistral AI",
  "DeepSeek",
  "Moonshot AI (Kimi)",
];

const SLUG_TO_LABEL: Record<string, string> = {
  anthropic: "Anthropic (Claude)",
  openai: "OpenAI (GPT)",
  google: "Google (Gemini)",
  "x-ai": "xAI (Grok)",
  "meta-llama": "Meta (Llama)",
  mistralai: "Mistral AI",
  deepseek: "DeepSeek",
  moonshotai: "Moonshot AI (Kimi)",
};

export const OTHER_LABEL = "기타";

/** TRACKED_PROVIDERS 밖의 provider(및 OpenRouter 자체 집계인 "other")는 전부 "기타"로 합산. */
export function providerLabel(slug: string): string {
  return SLUG_TO_LABEL[slug] ?? OTHER_LABEL;
}

export function getProviderColor(label: string): { light: string; dark: string } {
  const index = PROVIDER_ORDER.indexOf(label);
  if (index === -1) return OTHER_COLOR;
  return CATEGORY_COLORS[index];
}

export type UsageBucket = {
  week: string;
  shares: Record<string, number>;
  tokens: Record<string, number>;
};

export function aggregateUsageByWeek(rows: AiUsageRow[]): UsageBucket[] {
  const byWeek = new Map<string, UsageBucket>();
  for (const row of rows) {
    if (!byWeek.has(row.week)) {
      byWeek.set(row.week, { week: row.week, shares: {}, tokens: {} });
    }
    const bucket = byWeek.get(row.week)!;
    const label = providerLabel(row.provider);
    bucket.shares[label] = (bucket.shares[label] ?? 0) + row.share_pct;
    bucket.tokens[label] = (bucket.tokens[label] ?? 0) + row.total_tokens;
  }
  return [...byWeek.values()].sort((a, b) => a.week.localeCompare(b.week));
}

export function getActiveProviderLabels(buckets: UsageBucket[]): string[] {
  const present = new Set<string>();
  for (const bucket of buckets) {
    for (const key of Object.keys(bucket.shares)) present.add(key);
  }
  const ordered = PROVIDER_ORDER.filter((p) => present.has(p));
  return present.has(OTHER_LABEL) ? [...ordered, OTHER_LABEL] : ordered;
}
