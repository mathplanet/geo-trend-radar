"""Supabase 저장 레이어 (collect.py, summarize.py 공유).

3단계: 로컬 data/items.json -> Supabase 전환 (BUILD-GUIDE.md 3단계).
쓰기는 service_role 키만 사용 (원칙: 쓰기는 GitHub Actions에만, 대시보드는 anon 읽기 전용).
"""
import os
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

from dotenv import load_dotenv
from supabase import create_client

# Windows 콘솔 기본 코드페이지(cp949)가 이모지/특수문자에서 죽는 것을 방지
for _stream in (sys.stdout, sys.stderr):
    if hasattr(_stream, "reconfigure"):
        _stream.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
load_dotenv(ROOT / ".env")

_client = None


def get_client():
    global _client
    if _client is None:
        url = os.environ["SUPABASE_URL"]
        key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
        _client = create_client(url, key)
    return _client


def count_items():
    resp = get_client().table("items").select("id", count="exact").limit(1).execute()
    return resp.count


def upsert_items(items):
    """url_hash UNIQUE 제약 기반 upsert. summary/cluster/insight/relevant는 payload에서 빠져있어야
    (즉 이 함수 호출 시 items에 그 키들을 넣지 않아야) 재수집 시 기존 요약 결과를 덮어쓰지 않는다."""
    if not items:
        return
    get_client().table("items").upsert(items, on_conflict="url_hash").execute()


def fetch_all_items():
    resp = get_client().table("items").select("*").execute()
    return resp.data


def update_item_summary(item_id, summary, cluster, insight, relevant):
    get_client().table("items").update({
        "summary": summary,
        "cluster": cluster,
        "insight": insight,
        "relevant": relevant,
    }).eq("id", item_id).execute()


def update_item_cluster(item_id, cluster):
    get_client().table("items").update({"cluster": cluster}).eq("id", item_id).execute()


def upsert_digest(week, headline_item_ids, overview, category_insights=None):
    """week UNIQUE 제약 기반 upsert. 같은 주에 여러 번 실행돼도 digests에 중복 행이 쌓이지 않는다."""
    get_client().table("digests").upsert({
        "week": week,
        "headline_items": headline_item_ids,
        "overview": overview,
        "category_insights": category_insights or {},
    }, on_conflict="week").execute()


def within_window(item, days):
    """published_at(피드 제공, 가끔 부정확/오래됨)나 collected_at(우리가 기록, 항상 신뢰 가능)
    둘 중 하나라도 최근 N일 이내면 포함시킨다. published_at만 믿으면 피드가 잘못된 날짜를 주는
    글이 영원히 요약 대상에서 빠지는 문제가 있었음 (ISSUES.md 참고)."""
    cutoff = datetime.now(timezone.utc) - timedelta(days=days)
    for key in ("published_at", "collected_at"):
        ts = item.get(key)
        if not ts:
            continue
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        if dt >= cutoff:
            return True
    return False


def current_week_range():
    """이번 주 [월요일 00:00, 일요일 23:59:59] UTC 범위.
    대시보드(queries.ts의 isoWeekToRange)와 동일한 규칙."""
    now = datetime.now(timezone.utc)
    monday = (now - timedelta(days=now.weekday())).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    sunday = monday + timedelta(days=6, hours=23, minutes=59, seconds=59)
    return monday, sunday


def within_current_week(item):
    """다이제스트에 다른 주의 글이 섞이는 것을 막기 위한 엄격한 필터.
    --days 롤링 윈도우는 정확한 주 경계와 어긋날 수 있어(예: --days 30으로 재실행하면
    지난 주 글까지 이번 주 다이제스트에 섞임), 다이제스트 대상 선정에는 이 함수를 쓴다.
    published_at/collected_at 중 하나라도 이번 주 범위에 들어오면 포함."""
    start, end = current_week_range()
    for key in ("published_at", "collected_at"):
        ts = item.get(key)
        if not ts:
            continue
        dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
        if start <= dt <= end:
            return True
    return False
