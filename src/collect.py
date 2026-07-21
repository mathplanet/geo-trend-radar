"""GEO Trend Radar - 1단계: RSS 수집 -> 키워드 필터 -> Supabase upsert

REFERENCE.md §3~4 규칙을 그대로 구현.
url_hash UNIQUE + upsert(on_conflict=url_hash)로 중복/멱등성을 DB 레벨에서 보장 (3단계, BUILD-GUIDE.md).
"""
import hashlib
import re
import socket
from datetime import datetime, timedelta, timezone

import feedparser
import yaml

from store import ROOT, count_items, upsert_items

SOURCES_PATH = ROOT / "sources.yaml"
KEYWORDS_PATH = ROOT / "keywords.yaml"

RAW_SUMMARY_MAX_LEN = 500  # Supabase 무료 티어 용량 절약 (BUILD-GUIDE.md 운영 체크리스트)
FEED_TIMEOUT_SECONDS = 15
# 격일로 수집하므로, 진짜 새 글이면 published_at이 수집 시점 기준 하루 전까지는 들어와야 한다.
# 일부 피드(예: 네이버 웹마스터 블로그)는 몇 년 전 글을 계속 "최신"인 것처럼 내보내는데,
# 예전엔 이런 글의 published_at만 비우고 계속 수집했더니 화면에서 collected_at으로
# 대체 표시되며 오늘 글처럼 보이는 문제가 있었음 (ISSUES.md 참고). 이제는 아예 수집 대상에서
# 제외한다 (published_at이 없는 경우는 판단 불가라 그대로 수집).
MAX_PUBLISHED_AGE_DAYS = 1

TAG_RE = re.compile(r"<[^<]+?>")


def load_sources():
    with open(SOURCES_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)["sources"]


def load_keywords():
    """keywords.yaml의 categories 구조를 평탄화한다.
    반환값: keywords(kw->가중치), keyword_category(kw->대분류 라벨), patterns, default_threshold, tier_thresholds
    """
    with open(KEYWORDS_PATH, "r", encoding="utf-8") as f:
        config = yaml.safe_load(f)

    keywords = {}
    keyword_category = {}
    for category in config["categories"].values():
        label = category["label"]
        for keyword, weight in category["keywords"].items():
            keywords[keyword] = weight
            keyword_category[keyword] = label

    patterns = {
        keyword: re.compile(r"\b" + re.escape(keyword) + r"\b")
        for keyword in keywords
    }
    return keywords, keyword_category, patterns, config["default_threshold"], config["tier_thresholds"]


def strip_html(text):
    return TAG_RE.sub("", text or "").strip()


def score_entry(text, keywords, patterns):
    matched = [kw for kw, pattern in patterns.items() if pattern.search(text)]
    score = sum(keywords[kw] for kw in matched)
    return matched, score


def categorize_all(matched, keyword_category):
    """매칭된 키워드가 속한 그룹을 전부 태그한다 (가중치 무관, multi-tag).
    한 글이 여러 그룹(대시보드 탭)에 동시에 속할 수 있다."""
    labels = {keyword_category[kw] for kw in matched}
    return sorted(labels)


def resolve_threshold(source, tier_thresholds, default_threshold):
    if "threshold" in source:
        return source["threshold"]
    return tier_thresholds.get(source["tier"], default_threshold)


def parse_published_at(entry):
    """피드가 날짜를 안 주면 None (판단 불가 -> caller가 그대로 수집)."""
    parsed = entry.get("published_parsed")
    if not parsed:
        return None
    return datetime(*parsed[:6], tzinfo=timezone.utc).isoformat()


def is_too_old(published_at):
    """published_at이 있는데 수집 시점 기준 MAX_PUBLISHED_AGE_DAYS보다 오래됐으면 True.
    날짜 정보가 아예 없으면(None) 판단을 보류하고 False(제외하지 않음)를 반환한다."""
    if not published_at:
        return False
    dt = datetime.fromisoformat(published_at)
    return dt < datetime.now(timezone.utc) - timedelta(days=MAX_PUBLISHED_AGE_DAYS)


def collect_source(source, keywords, keyword_category, patterns, tier_thresholds, default_threshold):
    """단일 소스를 수집한다. 실패해도 예외를 삼켜 다른 소스 수집을 막지 않는다 (NFR: 소스별 격리)."""
    name = source["name"]
    tier = source["tier"]
    threshold = resolve_threshold(source, tier_thresholds, default_threshold)

    try:
        feed = feedparser.parse(source["feed_url"])
    except Exception as e:
        print(f"[실패] {name}: 피드 파싱 에러 - {e}")
        return []

    entries = feed.entries or []
    total = len(entries)
    if total == 0:
        print(f"[{tier}] {name}: 엔트리 0 - 피드 URL 확인 필요")
        return []

    passed_items = []
    stale_count = 0
    for entry in entries:
        title = entry.get("title", "")
        raw_summary_full = strip_html(entry.get("summary", "") or entry.get("description", ""))
        text = f"{title} {raw_summary_full}".lower()

        matched, score = score_entry(text, keywords, patterns)
        if score < threshold:
            continue

        published_at = parse_published_at(entry)
        if is_too_old(published_at):
            stale_count += 1
            continue

        url = entry.get("link")
        if not url:
            continue
        url_hash = hashlib.sha256(url.encode("utf-8")).hexdigest()
        categories = categorize_all(matched, keyword_category)

        # summary/cluster/insight/relevant는 일부러 넣지 않는다 (store.upsert_items 참고):
        # 이미 요약된 기존 행이 재수집 시 upsert로 덮어써져 null로 되돌아가는 것을 방지.
        item = {
            "url": url,
            "url_hash": url_hash,
            "title": title,
            "source": name,
            "tier": tier,
            "published_at": published_at,
            "matched_keywords": matched,
            "relevance_score": score,
            "categories": categories,
            "raw_summary": raw_summary_full[:RAW_SUMMARY_MAX_LEN],
        }
        passed_items.append(item)

    stale_note = f" (오래된 글 {stale_count}건 제외)" if stale_count else ""
    print(f"[{tier}] {name}: 총 {total}건 → 통과 {len(passed_items)}건{stale_note}")
    return passed_items


def main():
    socket.setdefaulttimeout(FEED_TIMEOUT_SECONDS)

    sources = load_sources()
    keywords, keyword_category, patterns, default_threshold, tier_thresholds = load_keywords()

    before = count_items()

    all_passed_items = []
    for source in sources:
        all_passed_items.extend(
            collect_source(
                source, keywords, keyword_category, patterns, tier_thresholds, default_threshold
            )
        )

    upsert_items(all_passed_items)
    after = count_items()

    print(f"\n이번 회차 통과 {len(all_passed_items)}건 / DB 행 수 {before} -> {after} (신규 {after - before}건)")
    print("--- 통과한 글 목록 ---")
    for item in all_passed_items:
        print(f"- [{item['source']}] ({item['relevance_score']}) {item['title']}")


if __name__ == "__main__":
    main()
