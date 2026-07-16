# GEO Trend Radar

GEO/SEO 트렌드를 자동 수집·요약해서 **팀이 함께 보는 웹 뉴스레터/대시보드**로 발행하는 프로젝트.

## 무엇을 하나

여러 SEO/AI검색 매체 RSS 수집 → 키워드로 유의미한 글 필터 → Claude 요약·인사이트 →
웹 대시보드에 주간 다이제스트로 발행. 격일 수집 / 주간 발행 자동화.

```
RSS 수집 → 키워드+등급별 필터 → 중복제거 → (Claude 요약) → 웹 대시보드
```

## 기술 스택

| 서비스 | 역할 |
|--------|------|
| GitHub Actions (Python) | 수집·요약 엔진 (cron) |
| Supabase (Postgres) | 데이터 저장, URL해시 중복차단 |
| Vercel (Next.js) | 웹 대시보드 |
| Anthropic Claude | 요약·인사이트 (주간 배치) |

## 핸드오프 문서 (여기부터 읽으세요)

| 문서 | 내용 |
|------|------|
| [`docs/REQUIREMENTS.md`](./docs/REQUIREMENTS.md) | **요구사항 정의서** — 목표·범위·기능/비기능 요구사항·아키텍처·미결 결정사항 |
| [`docs/REFERENCE.md`](./docs/REFERENCE.md) | **자료 정리본** — 소스 12개·키워드+가중치·필터 규칙·DB 스키마·확장 후보 |
| [`docs/BUILD-GUIDE.md`](./docs/BUILD-GUIDE.md) | **빌드 가이드** — 계정 준비부터 배포까지 단계별 + 검증 절차 |
| [`docs/OPERATIONS.md`](./docs/OPERATIONS.md) | **운영 가이드** — 접속 주소, 자동화 스케줄, 시크릿 관리, 트러블슈팅 |
| [`docs/ISSUES.md`](./docs/ISSUES.md) | **이슈 기록** — 구축 중 만난 문제와 해결 방법 (단계별) |

## 현재 상태

**1단계(수집·필터) 프로토타입 검증 완료.** 아래 파일이 동작합니다:

- `sources.yaml` — 소스 12개 (등급별 분류, 전부 RSS 작동 확인)
- `keywords.yaml` — 키워드+가중치, 등급별 threshold
- `src/collect.py` — 수집→필터→중복제거→`data/items.json`

로컬 실행:
```bash
python -m venv .venv
.venv/Scripts/pip install -r requirements.txt   # mac/linux: .venv/bin/pip
.venv/Scripts/python src/collect.py
```

**다음 단계**: 2단계(요약) → 3단계(Supabase) → 4단계(대시보드) → 5단계(자동화).
[`docs/BUILD-GUIDE.md`](./docs/BUILD-GUIDE.md) 참조.
```
