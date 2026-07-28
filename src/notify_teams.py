"""GEO Trend Radar - 다이제스트 발행 후 Teams에 요약 알림.

publish.yml에서 summarize.py 직후 실행. 가장 최근에 upsert된(created_at 기준)
다이제스트를 다시 읽어와 theme(이번 주 한 문장) + overview_points 불릿 +
대시보드 링크를 Teams Workflows 웹후크로 전송한다.
"""
import json
import os
import sys
import urllib.request

from store import get_client

DASHBOARD_URL = "https://geo-trend-radar.hyeontaek-ki.workers.dev"


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


def build_card(digest):
    """Teams Workflows의 'Post card in a chat or channel' 액션은 웹후크로 받은 JSON을
    그대로 Adaptive Card로 역직렬화한다 - 임의 JSON({"text": ...} 등)을 보내면
    "Property 'type' must be 'AdaptiveCard'" 에러로 실패한다. 그래서 정식 Adaptive
    Card 스키마를 직접 만들어 보낸다."""
    body = [
        {
            "type": "TextBlock",
            "text": f"GEO Trend Radar — {digest['week']} 다이제스트",
            "weight": "Bolder",
            "size": "Medium",
            "wrap": True,
        }
    ]
    if digest.get("theme"):
        body.append(
            {
                "type": "TextBlock",
                "text": digest["theme"],
                "wrap": True,
                "isSubtle": True,
                "spacing": "Small",
            }
        )

    points = digest.get("overview_points") or []
    if points:
        bullets = "\n".join(f"- {p['text']}" for p in points)
        body.append({"type": "TextBlock", "text": bullets, "wrap": True, "spacing": "Medium"})

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
    webhook_url = os.environ.get("TEAMS_WEBHOOK_URL")
    if not webhook_url:
        sys.exit("TEAMS_WEBHOOK_URL 환경변수가 필요합니다.")

    digest = get_latest_digest()
    if not digest:
        print("발행된 다이제스트가 없어 알림을 건너뜁니다.")
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
