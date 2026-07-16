# GEO Trend Radar — 운영 가이드

> 배포가 끝난 뒤 "이거 어떻게 쓰고 관리하지?"에 답하는 문서.
> 설계/구축 배경은 [`REQUIREMENTS.md`](./REQUIREMENTS.md), [`BUILD-GUIDE.md`](./BUILD-GUIDE.md) 참고.

## 1. 접속 주소

| 대상 | 주소 | 용도 |
|------|------|------|
| 대시보드(팀 공유) | https://geo-trend-radar.hyeontaek-ki.workers.dev | 이번 주 다이제스트 + 주차별 아카이브 |
| GitHub 레포 | https://github.com/mathplanet/geo-trend-radar | 코드, Actions 실행 이력 |
| Supabase 프로젝트 | https://supabase.com/dashboard/project/npamwrwiegihwqcszjuj | DB(테이블 데이터), SQL Editor |
| Cloudflare 대시보드 | https://dash.cloudflare.com → Workers & Pages → `geo-trend-radar` | 배포 이력, 도메인 설정 |

## 2. 전체 흐름 한눈에

```
[격일 09:00 KST]  collect.yml   → RSS 수집 → 키워드 필터 → Supabase.items upsert
[주 1회 월 08:00 KST]  publish.yml → Claude 요약·헤드라인 선정 → Supabase.digests upsert
                                   → 대시보드 재빌드·재배포 (Cloudflare Workers)
[상시]  대시보드 → Supabase 실시간 조회(anon 읽기 전용) → 렌더링
```

모든 자동화는 **GitHub Actions**가 실행한다. 로컬 PC나 개인 컴퓨터가 켜져 있을 필요 없음.

## 3. 자동화 스케줄 / 수동 실행

| 워크플로 | 주기 | 파일 | 하는 일 |
|----------|------|------|---------|
| Collect | 격일 09:00 KST (홀수일) | `.github/workflows/collect.yml` | RSS 수집·필터·적재 |
| Publish | 주 1회 월 08:00 KST | `.github/workflows/publish.yml` | 요약·다이제스트 생성 + 대시보드 재배포 |

### 수동으로 지금 바로 실행하고 싶을 때
GitHub 레포 → **Actions** 탭 → 원하는 워크플로 클릭 → **Run workflow** 버튼.

CLI로도 가능 (GitHub CLI 설치 후):
```bash
gh workflow run collect.yml
gh workflow run publish.yml
```

### 실행 로그 확인
GitHub 레포 → **Actions** 탭 → 실행 기록 클릭 → 각 step 로그 확인.
소스별 수집 결과("총 N건 → 통과 N건"), 요약 성공/실패 여부, 배포 URL 등이 여기 다 남는다.

## 4. 소스 / 키워드 수정

**코드 수정 없이 설정 파일만 고치면 반영됨** (NFR: 유지보수성).

- 소스 추가/삭제/등급 변경: [`sources.yaml`](../sources.yaml) 수정
- 키워드/가중치/threshold 조정: [`keywords.yaml`](../keywords.yaml) 수정

수정 후 커밋·푸시만 하면 다음 `collect.yml` 실행부터 자동 반영된다. 즉시 확인하고 싶으면 위 "수동 실행" 방법으로 `collect.yml`을 바로 돌려보면 됨.

> 필터가 너무 느슨하거나(무관한 글 유입) 너무 엄격하면(놓치는 글 발생), `keywords.yaml`의 가중치나 `tier_thresholds`를 조정. 상세 규칙은 [`REFERENCE.md §3`](./REFERENCE.md#3-필터-규칙).

## 5. 시크릿 관리

GitHub 레포 → **Settings → Secrets and variables → Actions**에 등록되어 있음.

| 시크릿 | 용도 | 값이 바뀌면 |
|--------|------|-------------|
| `SUPABASE_URL` | DB 접속 주소 | Supabase 프로젝트를 새로 만들면 갱신 |
| `SUPABASE_SERVICE_ROLE_KEY` | DB 쓰기(collect/publish 전용) | Supabase에서 키 재발급 시 갱신 |
| `NEXT_PUBLIC_SUPABASE_URL` | 대시보드 빌드용 (URL, 위와 동일 값) | 위와 동일 |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 대시보드 읽기 전용 키 | Supabase에서 anon 키 재발급 시 갱신 |
| `ANTHROPIC_API_KEY` | 요약·다이제스트 생성 | 키 만료/재발급 시 갱신 |
| `CLOUDFLARE_API_TOKEN` | 대시보드 자동 배포 | 토큰 만료/유출 의심 시 재발급 |
| `CLOUDFLARE_ACCOUNT_ID` | 배포 대상 계정 식별 | 계정 이전 시에만 |

**시크릿 값을 바꿀 때는 반드시 GitHub 웹 UI(위 경로)에서 등록한다.** CLI(`gh secret set`)의 대화형 프롬프트가 이 환경에서 값을 제대로 못 받는 문제가 있었음 ([`ISSUES.md`](./ISSUES.md) 참고). 값을 명령어 인자로 직접 넘기는 것도 절대 금지 — 대화/터미널 기록에 그대로 노출된다.

## 6. 트러블슈팅 체크리스트

- [ ] **수집 로그에 "엔트리 0 - 피드 URL 확인 필요"가 뜬다** → 해당 RSS 피드가 일시적으로 비어있거나 URL이 깨진 것. 계속 반복되면 `sources.yaml`에서 feed_url 재확인.
- [ ] **대시보드에 이번 주 다이제스트가 안 보인다** → `publish.yml`이 정상 실행됐는지 Actions 탭 확인. summarize 단계에서 관련 글이 0건이면 다이제스트 자체가 생성되지 않음(정상 동작).
- [ ] **대시보드가 배포 직후 잠깐 404/오래된 내용을 보여준다** → Cloudflare 엣지 전파 지연(보통 30~60초). 좀 기다렸다 새로고침.
- [ ] **주차별 아카이브(`/2026-W29` 등)가 404** → 해당 주차에 발행된 digests 행이 없는 것. Supabase SQL Editor에서 `select week from digests;`로 실제 존재하는 주차 확인.
- [ ] **LLM 비용이 예상보다 많이 나온다** → `publish.yml`이 의도치 않게 자주 실행되고 있지 않은지 Actions 탭에서 실행 빈도 확인 (주 1회 배치 유지가 원칙, NFR).
- [ ] **Anthropic API 크레딧 부족 에러** → https://console.anthropic.com Plans & Billing에서 잔액 확인 후 충전.

## 7. 비용 현황 (전부 무료 티어)

| 서비스 | 사용 중인 플랜 | 한도 |
|--------|----------------|------|
| GitHub Actions | Public 레포 | 무제한 (public repo는 Actions 무료) |
| Supabase | Free tier | DB 500MB, 1주 무활동 시 일시정지되나 격일 cron이 유지시킴 |
| Cloudflare Workers | Free tier | 상업적 이용 제한 없음, 일일 요청 한도 존재(내부 팀 트래픽 수준에서 문제 없음) |
| Anthropic API | 종량제 | 주 1회 배치만 호출하므로 저비용 |

## 8. 알아둘 것

- 대시보드는 **읽기 전용**이다. 데이터 쓰기/수정은 전부 GitHub Actions(collect/publish)를 통해서만 일어난다.
- 대시보드 홈(`/`)은 정적으로 빌드되어, `publish.yml`이 재배포할 때만 최신 내용으로 갱신된다. 실시간으로 매 요청마다 DB를 다시 조회하는 구조가 아니다.
- 소스 코드 구조·설계 배경이 궁금하면 [`REQUIREMENTS.md`](./REQUIREMENTS.md), [`REFERENCE.md`](./REFERENCE.md), [`BUILD-GUIDE.md`](./BUILD-GUIDE.md) 순으로 읽으면 된다.
