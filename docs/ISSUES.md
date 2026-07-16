# GEO Trend Radar — 빌드 중 발생한 이슈 기록

> 1~5단계를 실제로 구축·배포하면서 만난 문제와 해결 방법을 단계 순서대로 정리.
> 같은 문제를 다시 만났을 때 빠르게 참고하기 위한 문서.

## 1단계 — 수집·필터

### Python이 로컬에 실제로 설치되어 있지 않았음
- 증상: `python --version`이 Microsoft Store 연결 스텁만 실행하고 끝남 (exit code 49).
- 원인: 시스템에 Python 미설치, `python.exe`가 Store 설치 유도용 스텁으로만 등록됨.
- 해결: 이미 설치돼 있던 Miniconda(`C:\Users\<user>\miniconda3\python.exe`)로 venv 생성.

### Windows 콘솔 인코딩(cp949)으로 인한 크래시
- 증상: `collect.py` 실행 중 `–`(en dash) 같은 특수문자를 출력할 때 `UnicodeEncodeError: 'cp949' codec can't encode character`로 크래시.
- 원인: Windows 콘솔 기본 코드페이지가 cp949라 유니코드 특수문자를 출력 못 함.
- 해결: 스크립트 시작 시 `sys.stdout`/`sys.stderr`를 `encoding="utf-8", errors="replace"`로 재설정 (`src/store.py`에 공통 처리).

## 2단계 — 요약

### Anthropic 계정 크레딧 부족
- 증상: `summarize.py` 실행 시 전 건이 `Your credit balance is too low` 400 에러.
- 원인: API 키는 정상이었으나 계정에 크레딧이 없었음 (결제 화면 자체의 별도 이슈 - 카드 등록 후 구매 버튼 비활성화 문제도 있었음).
- 해결: Cloudflare/Anthropic 콘솔에서 크레딧 충전 완료 후 재실행하여 정상 확인.

### Claude 응답에서 text 블록 추출 실패
- 증상: `resp.content[0].text`에서 `AttributeError: 'ThinkingBlock' object has no attribute 'text'`.
- 원인: `claude-sonnet-5`가 extended thinking 블록을 응답 content 배열 맨 앞에 먼저 반환하고, 그 뒤에 실제 text 블록이 옴. `content[0]`이 항상 텍스트라는 가정이 틀림.
- 해결: `response.content`를 순회하며 `block.type == "text"`인 블록을 찾아 추출하는 `extract_text()` 헬퍼로 교체.

## 3단계 — Supabase 전환

### RLS로 인해 anon 키 조회가 빈 배열만 반환
- 증상: service_role 키로는 데이터가 잘 보이는데 anon 키로 같은 테이블을 조회하면 에러 없이 `[]`만 반환.
- 원인: 테이블에 RLS(Row Level Security)가 켜져 있는데 읽기 정책이 없어서, 정책이 없는 role(anon)의 조회는 조용히 0건으로 처리됨.
- 해결: `items`, `digests` 테이블에 `for select using (true)` 공개 읽기 정책 추가.

### REFERENCE.md 스키마에 없는 필드 필요
- 증상: `summarize.py`가 채우는 `items.relevant`(관련도 재평가), `digests.overview`(주간 총평) 컬럼이 원래 스키마(REFERENCE.md §5)에 없었음.
- 원인: 최초 스키마 설계 시 반영 안 된 필드. FR-6(관련도 재평가) 요구사항을 만족하려면 필요.
- 해결: `alter table items add column relevant boolean;`, `alter table digests add column overview text;` 로 확장.

### 재수집 시 기존 요약이 덮어써질 뻔한 문제 (사전에 방지)
- 잠재 문제: `collect.py`가 매번 `summary`/`cluster`/`insight`/`relevant`를 포함한 채로 upsert하면, 이미 요약된 행이 재수집 때마다 다시 `null`로 덮어써짐.
- 해결: upsert payload에서 해당 필드들을 아예 제외 → PostgREST의 `ON CONFLICT DO UPDATE`가 payload에 없는 컬럼은 건드리지 않는 점을 이용.

## 4단계 — 대시보드

### Vercel Hobby 플랜은 상업적 이용 불가
- 증상 아님, 사전 확인 사항: 회사 내부 보고용으로 쓸 계획인데 Vercel Hobby는 ToS상 비상업 용도로 한정.
- 해결: Cloudflare Pages(→ 실제로는 Workers + Assets)로 결정. 무료 티어에 상업적 이용 제한 없음.

### Next.js 16 기본 빌드(Turbopack)와 Cloudflare 어댑터 비호환
- 증상: `wrangler dev`로 로컬 프리뷰 실행 시 전 라우트가 500 에러.
  `ChunkLoadError: Failed to load chunk server/chunks/ssr/[root-of-the-server]__xxxx._.js`
- 원인: Next.js 16 기본 번들러(Turbopack)로 빌드한 결과물을 `@opennextjs/cloudflare`(1.20.1 시점)가 완전히 지원하지 못해 일부 SSR 청크를 못 찾음.
- 해결: `package.json`의 `build` 스크립트를 `next build --webpack`으로 변경, webpack 빌드로 전환하니 정상 동작.

### Supabase RLS 정책 (4단계에서 재확인)
- 3단계에서 이미 겪은 것과 동일한 원인으로, 대시보드에서도 anon 키 조회가 빈 화면으로 렌더링됨. RLS 정책 추가 후 해결 (위 3단계 항목 참고).

## 5단계 — 자동화

### Cloudflare 계정 이메일 미인증
- 증상: 첫 배포 시 `You need to verify your email address to use Workers` 에러.
- 해결: 가입 시 받은 인증 메일 확인 후 재시도.

### workers.dev 서브도메인 미등록
- 증상: 배포는 성공했지만 `You need to register a workers.dev subdomain before publishing to workers.dev` 에러.
- 원인: 계정에서 Workers를 처음 쓸 때 서브도메인 등록이 선행되어야 함 (계정당 최초 1회).
- 해결: 대화형으로 `wrangler deploy` 재실행 시 뜨는 프롬프트에 `y`로 응답, 서브도메인 이름 입력하여 등록.

### 배포 직후 일시적 404 (엣지 전파 지연)
- 증상: 배포 완료 직후 홈페이지가 200/404를 번갈아 반환.
- 원인: Cloudflare 글로벌 엣지 네트워크에 새 배포가 전파되는 데 약 30~60초 소요.
- 해결: 별도 조치 없이 대기 후 재확인하니 안정적으로 200.

### GitHub CLI 미설치
- 해결: `winget install --id GitHub.cli`로 설치.

### Cloudflare API 토큰이 명령어 인자로 들어가 대화 기록에 노출
- 증상: `gh secret set <토큰값>` 형태로 실행하면서 토큰 문자열이 시크릿 **이름** 자리에 그대로 입력됨. 그 결과 토큰 값 자체가 대화 로그에 노출.
- 해결: 노출된 토큰은 즉시 Cloudflare 대시보드에서 폐기(delete), 새 토큰 발급.
- 재발 방지: 시크릿 값은 절대 명령어 인자로 넘기지 않고, `gh secret set NAME` 실행 후 뜨는 입력 프롬프트에만 붙여넣기.

### gh CLI 대화형 프롬프트가 값을 못 받는 문제
- 증상: `gh secret set CLOUDFLARE_API_TOKEN` 실행 후 프롬프트에 값을 입력해도, 실제로는 빈 문자열로 등록됨 (GitHub Actions 로그에서 다른 시크릿은 `***`로 마스킹되는데 이것만 빈 값으로 보임). 두 번 재시도해도 동일.
- 원인: 이 실행 환경(Claude Code의 `!` 대화형 셸 브릿지)에서 gh의 survey 스타일 stdin 프롬프트가 값을 제대로 못 받는 것으로 추정.
- 해결: CLI 대신 GitHub 웹사이트(`Settings → Secrets and variables → Actions → New repository secret`)에서 직접 등록. 이 경로는 값이 대화 기록이나 터미널 로그에 전혀 남지 않아 더 안전하기도 함.

### digests 테이블에 중복 행 누적 (멱등성 버그)
- 증상: `publish.yml`을 여러 번 실행(수동 테스트 포함)했더니 같은 주차(`2026-W29`)로 `digests` 행이 4개까지 쌓임. 이로 인해 대시보드의 `/[week]` 라우트가 "단일 행 기대" 쿼리(`.maybeSingle()`)에서 깨져 404 발생.
- 원인: `store.py`의 `insert_digest()`가 매번 새 행을 `insert`하고 있었음. `items`는 `url_hash` UNIQUE + upsert로 멱등성을 보장했지만, `digests`는 같은 처리를 빠뜨림.
- 해결:
  1. 중복 행 삭제 (최신 1건만 유지)
  2. `digests` 테이블에 `unique (week)` 제약 추가
  3. `insert_digest` → `upsert_digest`로 변경, `on_conflict="week"` 적용
  4. `publish.yml`을 2회 연속 수동 실행해 행 수가 늘지 않음을 재검증
