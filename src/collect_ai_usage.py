"""GEO Trend Radar - AI 서비스 탭: OpenRouter 사용량/모델 목록 주간 수집

publish.yml에서 summarize.py와 함께 주 1회 실행. 두 가지를 갱신한다:
1. ai_usage: rankings-daily(최근 30일, 하루 top-50 모델 + 나머지 합계 "other")에서
   이번 주(월~일, store.current_week_range와 동일 규칙) 날짜만 골라 provider(모델
   슬러그의 "/" 앞부분)별 토큰을 합산하고 비중(%)을 구해 upsert한다.
2. ai_active_models: /models 전체 목록에서 TRACKED_PROVIDERS에 속한 모델만 골라
   해당 provider 범위를 통째로 교체한다 (단종/개명된 모델이 안 남도록).

한계(ai_usage): top-50 밖으로 밀린 모델의 토큰은 provider와 무관하게 전부 OpenRouter의
'other' 합계로만 잡힌다. TRACKED_PROVIDERS의 실제 비중이 과소평가되는 일은 없지만
(이미 top-50 안에 있는 트래픽이니), 'other'의 내부 구성까지는 알 수 없다.
"""
import json
import os
import sys
import urllib.request
from datetime import date, datetime, timezone

from store import current_week_range, replace_active_models, upsert_ai_usage

MODELS_URL = "https://openrouter.ai/api/v1/models"
RANKINGS_URL = "https://openrouter.ai/api/v1/datasets/rankings-daily"

# dashboard/lib/aiUsage.ts의 SLUG_TO_LABEL과 동일한 provider 집합으로 맞출 것
# (양쪽 중 하나만 고치면 라벨이 안 맞거나 모델이 안 뜬다).
TRACKED_PROVIDERS = {
    "anthropic",
    "openai",
    "google",
    "x-ai",
    "meta-llama",
    "mistralai",
    "deepseek",
    "moonshotai",
}


def fetch_openrouter(url, api_key):
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {api_key}"})
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.load(resp)["data"]


def provider_of(slug):
    return slug.split("/")[0]


def aggregate_this_week(rows):
    week_start, week_end = current_week_range()
    start_date, end_date = week_start.date(), week_end.date()

    totals = {}
    for row in rows:
        row_date = date.fromisoformat(row["date"])
        if not (start_date <= row_date <= end_date):
            continue
        provider = provider_of(row["model_permaslug"])
        totals[provider] = totals.get(provider, 0) + int(row["total_tokens"])
    return totals


def build_details(m):
    """상세 보기(클릭 시 펼침)용 부가 정보. benchmarks는 구조가 커서 일부러 뺀다."""
    pricing = m.get("pricing") or {}
    architecture = m.get("architecture") or {}
    return {
        "context_length": m.get("context_length"),
        "pricing": {
            "prompt": pricing.get("prompt"),
            "completion": pricing.get("completion"),
        },
        "modality": architecture.get("modality"),
        "knowledge_cutoff": m.get("knowledge_cutoff"),
        # reasoning 키 자체가 추론 모델에만 존재하고, 나머지는 아예 없음 (직접 확인함).
        "reasoning_supported": "reasoning" in m,
    }


def sync_active_models(models):
    rows = []
    for m in models:
        provider = provider_of(m["id"])
        if provider not in TRACKED_PROVIDERS:
            continue
        created = m.get("created")
        rows.append(
            {
                "provider": provider,
                "model_id": m["id"],
                "name": m.get("name") or m["id"],
                "released_at": (
                    datetime.fromtimestamp(created, tz=timezone.utc).isoformat()
                    if created
                    else None
                ),
                "details": build_details(m),
            }
        )
    replace_active_models(TRACKED_PROVIDERS, rows)
    return rows


def main():
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        sys.exit("OPENROUTER_API_KEY 환경변수가 필요합니다.")

    rankings = fetch_openrouter(RANKINGS_URL, api_key)
    totals = aggregate_this_week(rankings)
    if totals:
        grand_total = sum(totals.values())
        week_start, _ = current_week_range()
        week_label = week_start.strftime("%G-W%V")
        usage_rows = [
            {
                "week": week_label,
                "provider": provider,
                "total_tokens": tokens,
                "share_pct": round(tokens / grand_total * 100, 2),
            }
            for provider, tokens in totals.items()
        ]
        upsert_ai_usage(usage_rows)
        print(f"=== {week_label} AI 사용량 ({len(usage_rows)}개 provider) ===")
        for row in sorted(usage_rows, key=lambda r: -r["share_pct"])[:10]:
            print(f"- {row['provider']}: {row['share_pct']}%")
    else:
        print("이번 주 rankings 데이터가 아직 없습니다 (30일 창 밖).")

    models = fetch_openrouter(MODELS_URL, api_key)
    active = sync_active_models(models)
    print(f"\n활성 모델 {len(active)}개 (TRACKED_PROVIDERS 기준) 갱신")


if __name__ == "__main__":
    main()
