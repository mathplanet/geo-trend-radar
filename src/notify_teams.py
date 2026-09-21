"""GEO Trend Radar - 다이제스트 발행 후 Teams에 요약 알림.

publish.yml에서 summarize.py 직후 실행. 가장 최근에 upsert된(created_at 기준)
다이제스트를 다시 읽어와 theme(이번 주 한 문장) + overview_points 불릿 +
대시보드 링크를 Teams Workflows 웹후크로 전송한다.
"""
import argparse
import json
import os
import sys
import urllib.request
from datetime import datetime, timedelta, timezone

from store import get_client

DASHBOARD_URL = "https://geo-trend-radar.cnx-aeo.workers.dev"

# summarize.py가 이번 주 다이제스트 대상 글이 없어 upsert를 스킵하면(예: cron 지연으로
# 주 경계를 넘겨 돌아 "이번 주"가 빈 새 주로 계산된 경우), get_latest_digest()는 여전히
# 지난주 행을 돌려준다. 이 스크립트는 summarize.py 직후 같은 job에서 실행되므로, 방금
# 만들어진 게 아니면(=오래된 digest면) 이미 지난주에 한 번 보낸 알림을 그대로 재발송하게
# 된다 (2026-W38 발행 때 실제로 발생). created_at이 이 시간 이내가 아니면 전송을 건너뛴다.
FRESHNESS_HOURS = 2


def get_latest_digest():
    resp = (
        get_client()
        .table("digests")
        .select("*")
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )
    return resp.data[0] if resp.data else None


def get_items_by_ids(ids):
    if not ids:
        return {}
    resp = get_client().table("items").select("id, source, url").in_("id", ids).execute()
    return {row["id"]: row for row in resp.data}


def format_week_range(week_label):
    """'2026-W30' -> '7월 20일~7월 26일' (대시보드 formatWeekRange와 동일 규칙, 표기만 한글)."""
    year, week = week_label.split("-W")
    monday = datetime.strptime(f"{year}-W{week}-1", "%G-W%V-%u")
    sunday = monday + timedelta(days=6)
    return f"{monday.month}월 {monday.day}일~{sunday.month}월 {sunday.day}일"


def build_bullet_row(point, items_by_id):
    """불릿 하나를 [색 점] [텍스트 + 출처 링크] 2열 ColumnSet으로 - 그냥 TextBlock보다
    "●"이 텍스트에 파묻히지 않고 카드 왼쪽에 정렬된 리스트처럼 보인다."""
    links = [
        f"[{items_by_id[item_id]['source'] or '출처'}]({items_by_id[item_id]['url']})"
        for item_id in point.get("item_ids", [])
        if item_id in items_by_id
    ]
    text = point["text"]
    if links:
        text += "  " + " · ".join(links)

    return {
        "type": "ColumnSet",
        "spacing": "Medium",
        "columns": [
            {
                "type": "Column",
                "width": "auto",
                "items": [{"type": "TextBlock", "text": "●", "color": "Accent", "spacing": "None"}],
            },
            {
                "type": "Column",
                "width": "stretch",
                "items": [{"type": "TextBlock", "text": text, "wrap": True, "spacing": "None"}],
            },
        ],
    }


def build_card(digest):
    """Teams Workflows의 'Post card in a chat or channel' 액션은 웹후크로 받은 JSON을
    그대로 Adaptive Card로 역직렬화한다 - 임의 JSON({"text": ...} 등)을 보내면
    "Property 'type' must be 'AdaptiveCard'" 에러로 실패한다. 그래서 정식 Adaptive
    Card 스키마를 직접 만들어 보낸다."""
    week_range = format_week_range(digest["week"])

    # 헤더: 강조 배경 컨테이너 안에 아이콘 + 타이틀을 나란히 배치.
    header = {
        "type": "Container",
        "style": "emphasis",
        "bleed": True,
        "items": [
            {
                "type": "ColumnSet",
                "columns": [
                    {
                        "type": "Column",
                        "width": "auto",
                        "verticalContentAlignment": "Center",
                        "items": [{"type": "TextBlock", "text": "📡", "size": "ExtraLarge", "spacing": "None"}],
                    },
                    {
                        "type": "Column",
                        "width": "stretch",
                        "verticalContentAlignment": "Center",
                        "items": [
                            {
                                "type": "TextBlock",
                                "text": "GEO TREND RADAR",
                                "size": "Small",
                                "weight": "Bolder",
                                "color": "Accent",
                                "spacing": "None",
                            },
                            {
                                "type": "TextBlock",
                                "text": f"{week_range} 다이제스트",
                                "size": "Large",
                                "weight": "Bolder",
                                "wrap": True,
                                "spacing": "None",
                            },
                        ],
                    },
                ],
            }
        ],
    }

    body = [header]

    if digest.get("theme"):
        body.append(
            {
                "type": "Container",
                "spacing": "Medium",
                "items": [
                    {
                        "type": "TextBlock",
                        "text": digest["theme"],
                        "wrap": True,
                        "isSubtle": True,
                        "size": "Medium",
                    }
                ],
            }
        )

    points = digest.get("overview_points") or []
    if points:
        all_ids = [item_id for p in points for item_id in p.get("item_ids", [])]
        items_by_id = get_items_by_ids(all_ids)

        bullets_container = {
            "type": "Container",
            "spacing": "Medium",
            "separator": True,
            "items": [
                {
                    "type": "TextBlock",
                    "text": "이번 주 꼭 알아야 할 사항",
                    "size": "Small",
                    "weight": "Bolder",
                    "color": "Accent",
                }
            ]
            + [build_bullet_row(p, items_by_id) for p in points],
        }
        body.append(bullets_container)

    return {
        "type": "AdaptiveCard",
        "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
        "version": "1.4",
        "body": body,
        "actions": [
            {
                "type": "Action.OpenUrl",
                "title": "대시보드에서 전체 보기",
                "url": f"{DASHBOARD_URL}/{digest['week']}",
            }
        ],
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--force",
        action="store_true",
        help="최신 다이제스트가 오래됐어도(=이번 실행에서 새로 만들어진 게 아니어도) 강제로 전송",
    )
    args = parser.parse_args()

    webhook_url = os.environ.get("TEAMS_WEBHOOK_URL")
    if not webhook_url:
        sys.exit("TEAMS_WEBHOOK_URL 환경변수가 필요합니다.")

    digest = get_latest_digest()
    if not digest:
        print("발행된 다이제스트가 없어 알림을 건너뜁니다.")
        return

    created_at = datetime.fromisoformat(digest["created_at"].replace("Z", "+00:00"))
    age_hours = (datetime.now(timezone.utc) - created_at).total_seconds() / 3600
    if not args.force and age_hours > FRESHNESS_HOURS:
        print(
            f"최신 다이제스트({digest['week']})가 {age_hours:.1f}시간 전에 생성됨 - "
            f"이번 실행에서 새로 만들어진 게 아닌 것으로 보여 전송을 건너뜁니다. "
            f"(의도적으로 지난 다이제스트를 재전송하려면 --force)"
        )
        return

    payload = json.dumps(build_card(digest)).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        print(f"Teams 알림 전송 완료 (status={resp.status})")


if __name__ == "__main__":
    main()
