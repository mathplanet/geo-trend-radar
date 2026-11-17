export type Locale = "ko" | "en";
export const LOCALE_COOKIE = "locale";

/** 한글/영문 필드 쌍 중 locale에 맞는 값을 고른다. 번역이 아직 없는 과거 데이터는
 * 항상 한글로 폴백 (빈 화면보다 낫다). */
export function pick(
  locale: Locale,
  ko: string | null | undefined,
  en: string | null | undefined
): string {
  if (locale === "en" && en) return en;
  return ko ?? en ?? "";
}

/** 그룹(카테고리) 이름은 keywords.yaml에 고정된 12개뿐이라 AI 번역 대신 정적 사전으로 처리.
 * category_insights/categories의 키(그룹명)는 항상 한글 그대로 저장되므로, 화면에 보여줄
 * 때만 이 사전으로 치환한다 - 데이터 조회 키는 절대 변환하지 않는다. */
export const CATEGORY_LABELS_EN: Record<string, string> = {
  "AI 검색 플랫폼": "AI Search Platforms",
  "GEO/AEO 최적화 전략": "GEO/AEO Strategy",
  "측정·모니터링 도구": "Measurement & Monitoring",
  "전통 SEO·검색엔진": "Traditional SEO & Search Engines",
  "시장·비즈니스 임팩트": "Market & Business Impact",
  "구조화 데이터/마크업": "Structured Data & Markup",
  "콘텐츠 구조/추출성": "Content Structure & Extractability",
  "엔티티/시맨틱": "Entity & Semantic",
  "인용/검색가능성": "Citability & Retrievability",
  "AI 크롤러 접근성": "AI Crawler Access",
  "신뢰·품질 신호": "Trust & Quality Signals",
  "렌더링·기술 접근성": "Rendering & Technical Accessibility",
  "기타": "Other",
};

export function categoryLabel(locale: Locale, koLabel: string): string {
  if (locale === "ko") return koLabel;
  return CATEGORY_LABELS_EN[koLabel] ?? koLabel;
}

const UI_KO = {
  navDigest: "다이제스트",
  navSearch: "검색",
  navStats: "수집 현황",
  navAiUsage: "AI 서비스",
  navRequests: "요청",
  headerSubtitle: "GEO/SEO 트렌드 주간 다이제스트",
  digestSuffix: "다이제스트",
  latestBadge: "최신",
  keyUpdatesHeading: "이번 주 꼭 알아야 할 사항",
  headlinesHeading: "이번 주 헤드라인",
  noItemsThisWeek: "이번 주 수집된 글이 없습니다.",
  unknownSource: "출처 미상",
  source: "출처",
  viewOriginal: "에서 원문 보기 ↗",
  allTab: "전체",
  allSources: "전체 소스",
  searchPlaceholder: "제목·요약 검색...",
  period: "기간",
  reset: "초기화",
  noResults: "검색 결과가 없습니다.",
  uncategorized: "미분류",
  sourceLabel: "소스",
  sortLabel: "정렬",
  sortRelevance: "관련도순",
  sortRecent: "최신순",
  prevPage: "이전 페이지",
  nextPage: "다음 페이지",
  weeklyViewHeading: "주차별 보기",
  weekSummaryHeading: "이번 주 요약",
  collectedCountSuffix: "건 수집",
  groupStatusHeading: "그룹별 현황",
  otherWeeksHeading: "다른 주차 보기",
  searchTitle: "검색",
  searchDescription: "특정 주차에 한정되지 않고, 지금까지 수집된 모든 글에서 찾습니다.",
  statsTitle: "수집 현황",
  statsDescription: "주차별·일자별로 그룹(카테고리)마다 몇 건이 수집됐는지 확인합니다.",
  aiUsageTitle: "AI 서비스",
  requestsTitle: "요청",
  official: "공식",
  media: "매체",
  community: "커뮤니티",
  itemsCountSuffix: "건",
  noData: "데이터가 없습니다.",
  statsViewBar: "막대",
  statsViewTrend: "추세선",
  statsViewTable: "표",
  statsGranularityWeek: "주간",
  statsGranularityDay: "일별",
  statsTableWeekCol: "주차",
  statsTableDateCol: "날짜",
  statsTableTotalCol: "합계",
  statsTierCol: "등급",
  statsCountCol: "수집 건수",
  statsNoiseCol: "노이즈 비율",
  statsAvgScoreCol: "평균 관련도",
  statsBySourceHeading: "소스별 통계",
  statsKeywordTrendHeading: "키워드 트렌드",
  statsPersistentHeading: "지속되는 주제",
  statsNoPersistent: "아직 2주 이상 이어지는 주제가 없습니다.",
  statsWeekSuffix: "주",
} as const;

const UI_EN: Record<keyof typeof UI_KO, string> = {
  navDigest: "Digest",
  navSearch: "Search",
  navStats: "Collection Stats",
  navAiUsage: "AI Usage",
  navRequests: "Requests",
  headerSubtitle: "Weekly GEO/SEO Trend Digest",
  digestSuffix: "Digest",
  latestBadge: "Latest",
  keyUpdatesHeading: "Key Updates This Week",
  headlinesHeading: "Headlines This Week",
  noItemsThisWeek: "No items were collected this week.",
  unknownSource: "Unknown source",
  source: "Source",
  viewOriginal: "View original ↗",
  allTab: "All",
  allSources: "All sources",
  searchPlaceholder: "Search title or summary...",
  period: "Date range",
  reset: "Reset",
  noResults: "No results found.",
  uncategorized: "Uncategorized",
  sourceLabel: "Source",
  sortLabel: "Sort",
  sortRelevance: "Relevance",
  sortRecent: "Most recent",
  prevPage: "Previous page",
  nextPage: "Next page",
  weeklyViewHeading: "Browse by Week",
  weekSummaryHeading: "This Week",
  collectedCountSuffix: "items collected",
  groupStatusHeading: "By Group",
  otherWeeksHeading: "Other Weeks",
  searchTitle: "Search",
  searchDescription: "Searches everything collected so far, not limited to one week.",
  statsTitle: "Collection Stats",
  statsDescription: "See how many items were collected per group, by week or by day.",
  aiUsageTitle: "AI Usage",
  requestsTitle: "Requests",
  official: "Official",
  media: "Media",
  community: "Community",
  itemsCountSuffix: " items",
  noData: "No data available.",
  statsViewBar: "Bar",
  statsViewTrend: "Trend",
  statsViewTable: "Table",
  statsGranularityWeek: "Weekly",
  statsGranularityDay: "Daily",
  statsTableWeekCol: "Week",
  statsTableDateCol: "Date",
  statsTableTotalCol: "Total",
  statsTierCol: "Tier",
  statsCountCol: "Collected",
  statsNoiseCol: "Noise Rate",
  statsAvgScoreCol: "Avg. Relevance",
  statsBySourceHeading: "Stats by Source",
  statsKeywordTrendHeading: "Keyword Trends",
  statsPersistentHeading: "Persistent Topics",
  statsNoPersistent: "No topic has lasted 2+ weeks yet.",
  statsWeekSuffix: " wk",
};

const UI = { ko: UI_KO, en: UI_EN };

export function t(locale: Locale, key: keyof typeof UI_KO): string {
  return UI[locale][key] ?? UI_KO[key];
}
