import type { Item } from "./types";

export type StatsItem = Pick<Item, "collected_at" | "published_at" | "categories">;

export type Granularity = "week" | "day";

export type Bucket = {
  key: string;
  label: string;
  counts: Record<string, number>;
  total: number;
};

/** REFERENCE.md §4.1 선언 순서. 색상 슬롯을 고정 배정하기 위한 기준 순서
 * (탭 목록처럼 그때그때 존재하는 카테고리만 보고 순서를 정하면, 등장/소멸에 따라
 * 색이 바뀌어버려 "색은 항목을 따라가야지 순위를 따라가면 안 된다"는 원칙에 어긋남). */
export const CATEGORY_ORDER = [
  "AI 검색 플랫폼",
  "GEO/AEO 최적화 전략",
  "측정·모니터링 도구",
  "전통 SEO·검색엔진",
  "시장·비즈니스 임팩트",
  "구조화 데이터/마크업",
  "콘텐츠 구조/추출성",
  "엔티티/시맨틱",
  "인용/검색가능성",
  "AI 크롤러 접근성",
  "신뢰·품질 신호",
  "렌더링·기술 접근성",
];

export const OTHER_LABEL = "기타";
const MAX_COLORED_CATEGORIES = 8;

/** dataviz 레퍼런스 팔레트의 8개 categorical 슬롯 (고정 순서 - 인접쌍 CVD 검증된 순서, 절대 재배열 금지).
 * lib/aiUsage.ts도 동일한 팔레트를 재사용해 앱 전체 시각 언어를 통일한다. */
export const CATEGORY_COLORS = [
  { light: "#2a78d6", dark: "#3987e5" }, // blue
  { light: "#008300", dark: "#008300" }, // green
  { light: "#e87ba4", dark: "#d55181" }, // magenta
  { light: "#eda100", dark: "#c98500" }, // yellow
  { light: "#1baf7a", dark: "#199e70" }, // aqua
  { light: "#eb6834", dark: "#d95926" }, // orange
  { light: "#4a3aa7", dark: "#9085e9" }, // violet
  { light: "#e34948", dark: "#e66767" }, // red
];
export const OTHER_COLOR = { light: "#898781", dark: "#898781" };

export function getCategoryColor(category: string): { light: string; dark: string } {
  const index = CATEGORY_ORDER.indexOf(category);
  if (index === -1 || index >= MAX_COLORED_CATEGORIES) return OTHER_COLOR;
  return CATEGORY_COLORS[index];
}

export function toIsoWeekLabel(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

function toDayLabel(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function bucketKey(item: StatsItem, granularity: Granularity): string | null {
  const ts = item.collected_at ?? item.published_at;
  if (!ts) return null;
  const date = new Date(ts);
  return granularity === "week" ? toIsoWeekLabel(date) : toDayLabel(date);
}

function rankedKey(category: string): string {
  const index = CATEGORY_ORDER.indexOf(category);
  return index !== -1 && index < MAX_COLORED_CATEGORIES ? category : OTHER_LABEL;
}

/** 그룹(카테고리)은 multi-tag라 한 글이 여러 그룹의 카운트에 동시에 잡힌다.
 * 그래서 막대 합계가 그 기간 실제 수집 건수보다 클 수 있다 (의도된 동작). */
export function aggregateByCategory(items: StatsItem[], granularity: Granularity): Bucket[] {
  const buckets = new Map<string, Bucket>();

  for (const item of items) {
    const key = bucketKey(item, granularity);
    if (!key) continue;
    if (!buckets.has(key)) buckets.set(key, { key, label: key, counts: {}, total: 0 });
    const bucket = buckets.get(key)!;

    for (const category of item.categories ?? []) {
      const shownAs = rankedKey(category);
      bucket.counts[shownAs] = (bucket.counts[shownAs] ?? 0) + 1;
      bucket.total += 1;
    }
  }

  return [...buckets.values()].sort((a, b) => a.key.localeCompare(b.key));
}

/** 검색 결과 등에서 "어느 주차 글인지" 표시하기 위한 라벨. 그 주에 실제 digest가
 * 발행됐는지와 무관하게 순수 날짜만으로 ISO 주차를 계산한다. */
export function itemWeekLabel(item: Pick<Item, "published_at" | "collected_at">): string | null {
  const ts = item.published_at ?? item.collected_at;
  if (!ts) return null;
  return toIsoWeekLabel(new Date(ts));
}

export function getActiveCategories(buckets: Bucket[]): string[] {
  const present = new Set<string>();
  for (const bucket of buckets) {
    for (const key of Object.keys(bucket.counts)) present.add(key);
  }
  const ordered = CATEGORY_ORDER.filter((c) => present.has(c));
  return present.has(OTHER_LABEL) ? [...ordered, OTHER_LABEL] : ordered;
}
