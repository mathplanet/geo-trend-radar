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


def insert_digest(week, headline_item_ids, overview):
    get_client().table("digests").insert({
        "week": week,
        "headline_items": headline_item_ids,
        "overview": overview,
    }).execute()


def within_window(item, days):
    ts = item.get("published_at") or item.get("collected_at")
    if not ts:
        return True
    dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
    return dt >= datetime.now(timezone.utc) - timedelta(days=days)
