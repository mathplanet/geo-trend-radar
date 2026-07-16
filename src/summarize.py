"""GEO Trend Radar - 2단계: 요약 -> 클러스터링 -> 헤드라인 선정

BUILD-GUIDE.md 2단계 / REQUIREMENTS.md FR-6 구현.
3단계 전환: 입력/출력 모두 Supabase (items, digests 테이블).

모델 전략 (REQUIREMENTS.md D-3):
- 건별 요약/관련도 재평가: 저가 모델(Haiku)
- 헤드라인 선정/종합 총평: 상위 모델
언어 (D-1): 원제목은 영문 유지, 요약/시사점은 한글.
"""
import argparse
import json
import os
import sys
from datetime import datetime, timezone

import anthropic

from store import fetch_all_items, insert_digest, update_item_summary, within_window

PER_ITEM_MODEL = "claude-haiku-4-5-20251001"
DIGEST_MODEL = "claude-sonnet-5"

PER_ITEM_SYSTEM = """당신은 GEO/SEO 컨설팅 팀을 위한 리서치 어시스턴트입니다.
주어진 글의 제목과 원문 요약만 보고 아래 JSON 형식으로만 답하세요. 다른 텍스트는 출력하지 마세요.

{"relevant": true|false, "summary": "3줄 요약 (줄바꿈으로 구분, 한글)", "cluster": "주제 분류 (한글, 1~3단어)", "insight": "컨설턴트가 클라이언트에게 전달할 실무 시사점 (한글, 1~2문장)"}

- relevant: 이 글이 GEO(생성형 검색 최적화)/SEO 트렌드와 실질적으로 관련 있으면 true, 단순 홍보/채용/이벤트 공지 등 트렌드성이 없으면 false.
- summary: 원문을 안 읽어도 핵심을 이해할 수 있어야 함.
- insight: 뻔한 요약 반복이 아니라 "그래서 클라이언트에게 뭘 해야 하는가" 관점."""

DIGEST_SYSTEM = """당신은 GEO/SEO 트렌드 주간 다이제스트를 만드는 편집자입니다.
아래는 이번 주 수집된 글 목록(id·주제·요약·시사점)입니다.
가장 중요한 3~5개를 헤드라인으로 선정하고, 아래 JSON 형식으로만 답하세요.

{"headline_ids": [<int>, ...], "overview": "이번 주 흐름을 5분 안에 파악할 수 있는 한글 총평 3~5문장"}"""


def extract_text(response):
    """extended thinking 등으로 content[0]이 텍스트가 아닐 수 있어 text 블록을 직접 찾는다."""
    for block in response.content:
        if block.type == "text":
            return block.text
    raise ValueError("응답에 text 블록이 없습니다")


def parse_json_response(response):
    text = extract_text(response).strip()
    if text.startswith("```"):
        text = text.strip("`")
        if text.startswith("json"):
            text = text[4:]
    return json.loads(text)


def summarize_item(client, item):
    user_content = f"제목: {item['title']}\n원문 요약: {item.get('raw_summary') or '(없음)'}"
    resp = client.messages.create(
        model=PER_ITEM_MODEL,
        max_tokens=500,
        system=PER_ITEM_SYSTEM,
        messages=[{"role": "user", "content": user_content}],
    )
    return parse_json_response(resp)


def build_digest(client, items):
    lines = [
        f"- [id={item['id']}] ({item['cluster']}) {item['title']}\n"
        f"  요약: {item['summary']}\n  시사점: {item['insight']}"
        for item in items
    ]
    resp = client.messages.create(
        model=DIGEST_MODEL,
        max_tokens=1500,
        system=DIGEST_SYSTEM,
        messages=[{"role": "user", "content": "\n".join(lines)}],
    )
    return parse_json_response(resp)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--days", type=int, default=7, help="최근 N일 items만 대상 (기본 7)")
    parser.add_argument("--force", action="store_true", help="이미 요약된 글도 다시 요약")
    args = parser.parse_args()

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        sys.exit("ANTHROPIC_API_KEY 환경변수가 필요합니다.")
    client = anthropic.Anthropic(api_key=api_key)

    items = fetch_all_items()
    targets = [
        item for item in items
        if within_window(item, args.days) and (args.force or item.get("summary") is None)
    ]
    print(f"요약 대상 {len(targets)}건 (전체 {len(items)}건 중 최근 {args.days}일, force={args.force})")

    for item in targets:
        try:
            result = summarize_item(client, item)
        except Exception as e:
            print(f"[실패] {item['title'][:50]}: {e}")
            continue
        item["relevant"] = result.get("relevant", True)
        item["summary"] = result.get("summary")
        item["cluster"] = result.get("cluster")
        item["insight"] = result.get("insight")
        update_item_summary(item["id"], item["summary"], item["cluster"], item["insight"], item["relevant"])
        mark = "O" if item["relevant"] else "X"
        print(f"[{mark}] ({item['cluster']}) {item['title'][:60]}")

    digest_candidates = [
        item for item in items
        if within_window(item, args.days) and item.get("summary") and item.get("relevant", True)
    ]
    if not digest_candidates:
        print("헤드라인을 선정할 관련 글이 없습니다.")
        return

    digest = build_digest(client, digest_candidates)
    week_label = datetime.now(timezone.utc).strftime("%G-W%V")
    headline_ids = digest.get("headline_ids", [])
    overview = digest.get("overview")
    insert_digest(week_label, headline_ids, overview)

    by_id = {item["id"]: item for item in items}
    print(f"\n=== {week_label} 다이제스트 ===")
    print(overview)
    print("\n헤드라인:")
    for hid in headline_ids:
        item = by_id.get(hid)
        if item:
            print(f"- {item['title']} - {item['insight']}")


if __name__ == "__main__":
    main()
