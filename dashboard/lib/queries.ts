import { cache } from "react";
import { supabase } from "./supabase";
import type { StatsItem } from "./stats";
import type { Digest, Item } from "./types";

/** ISO 8601 주차 문자열("2026-W29", collect.py의 "%G-W%V"와 동일 규칙)을
 * 해당 주의 [월요일 00:00, 일요일 23:59:59] UTC 범위로 변환한다. */
export function isoWeekToRange(week: string): { start: Date; end: Date } {
  const [yearStr, weekPart] = week.split("-W");
  const year = Number(yearStr);
  const weekNum = Number(weekPart);

  const simple = new Date(Date.UTC(year, 0, 1 + (weekNum - 1) * 7));
  const dayOfWeek = simple.getUTCDay() || 7; // 일요일(0) -> 7
  const monday = new Date(simple);
  monday.setUTCDate(simple.getUTCDate() - dayOfWeek + 1);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  sunday.setUTCHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/** "2026-W29" -> "7/13~7/19" (주차 라벨만으로는 실제 날짜를 알 수 없어서 함께 표시). */
export function formatWeekRange(week: string): string {
  const { start, end } = isoWeekToRange(week);
  const fmt = (d: Date) => `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
  return `${fmt(start)}~${fmt(end)}`;
}

export async function getLatestDigest(): Promise<Digest | null> {
  const { data } = await supabase
    .from("digests")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getDigestByWeek(week: string): Promise<Digest | null> {
  const { data } = await supabase
    .from("digests")
    .select("*")
    .eq("week", week)
    .maybeSingle();
  return data;
}

export async function getAllDigestWeeks(): Promise<string[]> {
  const { data } = await supabase
    .from("digests")
    .select("week")
    .order("week", { ascending: false });
  return (data ?? []).map((row) => row.week);
}

/** 그 주차에 "발행"된 글만 포함한다 (수집 시점이 아니라). published_at이 있으면 그것만 보고,
 * 피드가 날짜를 아예 안 준 글(published_at 없음)에 한해서만 collected_at으로 대체한다.
 * 예전엔 published_at/collected_at 중 하나라도 범위에 들면 포함시켰는데, 그러면 실제로는
 * 훨씬 이전에 쓰인 글이 우연히 그 주에 수집됐다는 이유만으로 그 주차에 끼어드는 문제가 있었음
 * (ISSUES.md 참고). React.cache로 감싸서, 같은 요청 안에서 DigestView/사이드바가 각자 호출해도
 * Supabase 쿼리는 한 번만 나간다. */
export const getItemsForWeek = cache(async (week: string): Promise<Item[]> => {
  const { start, end } = isoWeekToRange(week);
  const { data } = await supabase
    .from("items")
    .select("*")
    .or(`relevant.is.null,relevant.eq.true`)
    .order("relevance_score", { ascending: false });

  return (data ?? []).filter((item) => {
    const ts = item.published_at ?? item.collected_at;
    if (!ts) return false;
    const date = new Date(ts);
    return date >= start && date <= end;
  });
});

/** 통계 페이지(수집 현황)용 전체 items. 대시보드 본문과 동일하게 relevant=false(노이즈)는 제외. */
export async function getAllItemsForStats(): Promise<StatsItem[]> {
  const { data } = await supabase
    .from("items")
    .select("collected_at, published_at, categories")
    .or(`relevant.is.null,relevant.eq.true`);
  return data ?? [];
}

/** 전역 검색용 전체 items (주차 제한 없이 전 기간 대상). */
export async function getAllItemsForSearch(): Promise<Item[]> {
  const { data } = await supabase
    .from("items")
    .select("*")
    .or(`relevant.is.null,relevant.eq.true`)
    .order("relevance_score", { ascending: false });
  return data ?? [];
}

