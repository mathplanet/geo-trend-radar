# GEO Trend Radar — 빌드 가이드 (빌더용)

> 이 문서만 따라가면 프로토타입 → 배포까지 단계별로 완성할 수 있습니다.
> 각 단계는 **다음으로 넘어가기 전 검증(verify)** 하도록 구성했습니다. 품질을 확인하며 진행하세요.

## 0. 사전 준비 (계정 & 키)

| 항목 | 용도 | 비고 |
|------|------|------|
| GitHub 레포 | 코드 + Actions cron | public이면 무료 |
| Supabase 프로젝트 | DB (+선택 인증) | 무료 티어. 1주 무활동 시 정지되나 격일 cron이 유지시킴 |
| Vercel 프로젝트 | 대시보드 호스팅 | **Hobby는 비상업 라이선스** → 회사용은 Pro 또는 Cloudflare Pages 검토 |
| Anthropic API 키 | 요약·인사이트 | 주 1회 배치라 저비용 |

### 등록할 시크릿 / 환경변수
- GitHub Actions Secrets: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`
- Vercel 환경변수: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (읽기 전용)

> 원칙: 쓰기(service_role)는 GitHub Actions에만, 대시보드는 읽기 전용(anon) 키만.

## 1단계 — 수집·필터 (프로토타입 검증)

레포에 동작하는 구현이 이미 있습니다 ([`src/collect.py`](../src/collect.py)).

```bash
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # (mac/linux: .venv/bin/pip)
.venv/Scripts/python src/collect.py
```

**Verify**: 콘솔의 "통과한 글" 목록을 눈으로 확인. 관련 없는 글이 20% 넘게 섞이면
`keywords.yaml`의 가중치/threshold를 조정 (규칙은 [`REFERENCE.md §3`](REFERENCE.md#3-필터-규칙)).

## 2단계 — 요약·인사이트 (품질 검증)

`src/summarize.py` 작성. 입력은 아직 로컬 `data/items.json`으로 두고 품질부터 확인.

- 입력: 최근 N일 items
- Claude 호출로 각 글에 대해 생성: `summary`(3줄), `cluster`(주제), `insight`(클라이언트 시사점)
- 주제별 클러스터링 + 헤드라인 3~5개 선정
- **모델 전략**: 건별 요약은 저가 모델(Haiku), 종합 인사이트는 상위 모델 혼용 (비용 최적화)
- **언어**: 원제목 영문 유지 + 요약/인사이트는 한글 권장 (팀 가독성)

**Verify**: 출력 요약이 원문 안 읽어도 이해되는지, 시사점이 컨설팅 관점에서 쓸만한지 확인.

## 3단계 — 저장소 전환 (로컬 JSON → Supabase)

1. Supabase 프로젝트 생성 → SQL 에디터에 [`REFERENCE.md §5`](REFERENCE.md#5-db-스키마) 스키마 실행.
2. `collect.py`의 저장부(`data/items.json` write)를 Supabase **upsert**(`on_conflict=url_hash`)로 교체.
   - `url_hash` UNIQUE 제약이 중복을 DB 레벨에서 막아줌 → 멱등성 확보.
3. `summarize.py`도 Supabase 조회/업데이트로 전환, `digests` 테이블에 주차 종합본 저장.

**Verify**: 배치를 2번 연속 실행해도 items 행 수가 늘지 않는지(중복 차단) 확인.

## 4단계 — 대시보드 (Next.js → Vercel)

- Next.js(App Router) + Supabase 클라이언트(anon 키, 읽기 전용).
- 페이지: `/` 이번 주 다이제스트, `/[week]` 주차별 아카이브.
- 화면 구성: 헤드라인 3~5개(제목+시사점) → 주제별 섹션 → 아이템 카드(제목·소스·날짜·요약·원문링크·점수).
- Vercel 연결 후 배포. 인증 없이 비공개 URL로 공유 (필요 시 Vercel Deployment Protection 추가).

**Verify**: 배포 URL에서 이번 주 다이제스트와 과거 주차 아카이브가 보이는지 확인.

## 5단계 — 자동화 (GitHub Actions cron)

`.github/workflows/` 에 2개 작성:

- `collect.yml` — 격일 cron, `collect.py` 실행 (수집·적재)
- `publish.yml` — 주 1회 cron, `summarize.py` 실행 후 대시보드 갱신(또는 Vercel 재검증 트리거)

```yaml
# 예시: 격일 09:00 KST = 00:00 UTC, 홀수일
on:
  schedule:
    - cron: '0 0 1-31/2 * *'
  workflow_dispatch:   # 수동 실행 버튼
```

> cron은 **UTC 기준**. KST 09:00 = UTC 00:00.

**Verify**: `workflow_dispatch`로 수동 1회 실행 → DB에 신규 적재/다이제스트 생성 확인.
그 후 스케줄 실행 로그 모니터링.

## 운영 체크리스트

- [ ] 소스 추가/삭제는 `sources.yaml`만 수정 (tier 지정 잊지 말 것)
- [ ] 키워드/가중치 조정은 `keywords.yaml`
- [ ] 피드 깨짐 감시: collect 로그의 "엔트리 0 - 피드 URL 확인 필요"
- [ ] LLM 비용 모니터링 (주간 배치 1회 유지, 건별 상시 호출 금지)
- [ ] Supabase 무료 티어 용량(500MB) — raw_summary는 500자로 잘라 저장 중

## 참고 문서
- 요구사항: [`REQUIREMENTS.md`](REQUIREMENTS.md)
- 소스·키워드·스키마: [`REFERENCE.md`](REFERENCE.md)
```
