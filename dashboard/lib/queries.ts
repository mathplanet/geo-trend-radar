import { supabase } from "./supabase";
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

/** published_at(피드 제공, 가끔 부정확)나 collected_at(우리가 기록, 항상 신뢰 가능) 둘 중
 * 하나라도 주차 범위에 들어오면 포함시킨다. published_at만 보면 피드가 엉뚱한 날짜를 주는
 * 글이 어느 주차에서도 안 보이는 문제가 있었음 (ISSUES.md 참고). */
export async function getItemsForWeek(week: string): Promise<Item[]> {
  const { start, end } = isoWeekToRange(week);
  const { data } = await supabase
    .from("items")
    .select("*")
    .or(`relevant.is.null,relevant.eq.true`)
    .order("relevance_score", { ascending: false });

  return (data ?? []).filter((item) => {
    return [item.published_at, item.collected_at].some((ts) => {
      if (!ts) return false;
      const date = new Date(ts);
      return date >= start && date <= end;
    });
  });
}

