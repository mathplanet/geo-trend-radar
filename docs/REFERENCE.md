# GEO Trend Radar — 레퍼런스 자료 정리본

> 소스 · 키워드 · 필터 규칙 · DB 스키마. 빌더가 그대로 사용/확장하면 됨.
> 실제 설정 파일: 레포 루트의 [`sources.yaml`](../sources.yaml), [`keywords.yaml`](../keywords.yaml)

## 1. 소스 리스트 (14개, 전부 RSS 작동 확인 완료)

`type: rss` · 등급(tier)은 노이즈 비율에 따른 분류 → 등급별 threshold 적용(§3).

### primary — 공식 1차 출처 (느슨하게, 놓치지 않게)
| 소스 | feed URL | 성격 |
|------|----------|------|
| Google Search Central Blog | `https://developers.google.com/search/blog/feed.xml` | 구글 검색 공식 발표 (SEO 실무 직결) |
| Google Search Product Blog | `https://blog.google/products/search/rss/` | AI Mode·AI Overviews 등 검색 제품 발표 |
| Bing Webmaster Blog | `https://blogs.bing.com/webmaster/feed` | Bing 검색 공식 발표 (AI 관련 기능 다수) |
| Naver 웹마스터 블로그 | `https://rss.blog.naver.com/naver_webmaster.xml` | 네이버 검색 공식 발표 (국내 검색 동향) |

### trade — SEO 전문 매체 (기본)
| 소스 | feed URL | 성격 |
|------|----------|------|
| Search Engine Land | `https://searchengineland.com/feed` | SEO/검색 뉴스 정통 |
| Search Engine Journal | `https://www.searchenginejournal.com/feed/` | SEO/검색 뉴스 |
| Search Engine Roundtable | `https://feeds.feedburner.com/SearchEngineRoundtable1` | 검색 업계 속보 |
| Ahrefs Blog | `https://ahrefs.com/blog/feed/` | SEO 툴/리서치 |
| Moz Blog | `https://moz.com/posts/rss/blog` | SEO 툴/전략 |
| Semrush Blog | `https://www.semrush.com/blog/feed/` | SEO 툴/전략 |
| Search Engine Watch | `https://www.searchenginewatch.com/feed/` | SEO/검색 뉴스 |

### broad — 노이즈 많은 광역 (엄격하게, 확실한 것만)
| 소스 | feed URL | 성격 |
|------|----------|------|
| OpenAI News | `https://openai.com/news/rss.xml` | ChatGPT Search 원출처 (피드 대용량 ~1000건) |
| Reddit r/SEO | `https://www.reddit.com/r/SEO/.rss` | 실무자 체감 트렌드 |
| SparkToro | `https://sparktoro.com/blog/feed/` | 오디언스 리서치 |

## 2. 확장 후보 소스 (RSS 미확인/보류)

RSS가 없거나 접근 차단되어 v1 제외. v2에서 `type: crawl`로 붙일 후보.

| 소스 | 상태 | 비고 |
|------|------|------|
| Anthropic News | RSS 없음 | LLM 인용 동작 관련, 크롤 필요 |
| a16z | 피드 차단(0건) | 시장 관점 |
| Reddit r/bigseo | 0건 반환 | 재확인 필요 |
| Profound / Otterly / Peec AI | RSS 없음 | GEO 전용 툴 벤더 (측정 1차 데이터) |
| 개인 뉴스레터 (Aleyda Solis, Lily Ray 등) | 개별 확인 | GEO 담론 선도 |

## 3. 필터 규칙

### 3.1 점수 계산
- 글의 **제목 + 요약** 텍스트(소문자)에서 각 키워드를 **단어 경계(`\b`) 매칭**.
  - 단어 경계 사용으로 `geo`가 `geography`/`geopolitics` 안에서 오탐되지 않음.
- 매칭된 키워드들의 **가중치를 합산** → `relevance_score`.

### 3.2 등급별 threshold
글은 `relevance_score >= threshold`일 때만 채택. threshold는 출처 등급에 따라 다름:

| 등급 | threshold | 의도 |
|------|-----------|------|
| primary | **2** | 원출처는 약하게 걸려도 통과 |
| trade | **3** | 표준 |
| broad | **5** | 노이즈 차단, 확실한 것만 |

- 유효 threshold 해석 우선순위: **출처별 override > 등급 기본값 > 전역 default(3)**.
- 특정 출처만 예외를 두려면 `sources.yaml`의 해당 항목에 `threshold: N` 추가.

## 4. 키워드 + 가중치 + 그룹 전체 리스트

`keywords.yaml` 원본과 동일. 각 키워드는 **가중치**(채택 여부를 정하는 `relevance_score` 계산에 사용)와
**그룹**(대시보드 탭 구분에 사용, `§4.1` 참고) 두 축을 모두 가진다.

### 4.1 그룹(category) 12개 — multi-tag

채택 여부(threshold 통과)는 기존처럼 **가중치 합산**으로 정하지만, 그룹 배정은 가중치와 무관하게
**매칭된 키워드가 속한 그룹을 전부 태그**한다. 즉 한 글이 여러 그룹(대시보드 탭)에 동시에 속할 수 있다.

| 그룹 key | 라벨 | 성격 |
|-----------|------|------|
| `ai_platform` | AI 검색 플랫폼 | 플랫폼별 신규 기능·발표 (ChatGPT, Perplexity, Gemini, AI Mode 등) |
| `geo_strategy` | GEO/AEO 최적화 전략 | "어떻게 최적화하는가" 상위 전략·개념 |
| `measurement_tools` | 측정·모니터링 도구 | GEO 성과를 어떻게 측정/추적하는가 |
| `traditional_seo` | 전통 SEO·검색엔진 | 기존 SEO 생태계, 구글 알고리즘 업데이트 |
| `market_impact` | 시장·비즈니스 임팩트 | 트래픽/광고/매출에 미치는 영향 |
| `structured_markup` | 구조화 데이터/마크업 | 스키마·마크업 등 구조화 신호 |
| `content_extractability` | 콘텐츠 구조/추출성 | AI가 답변을 뽑아내기 쉬운 콘텐츠 구조 |
| `entity_semantic` | 엔티티/시맨틱 | 엔티티 기반 SEO, 지식 그래프 |
| `citability` | 인용/검색가능성 | AI 답변에 인용되기 위한 검색·추출 가능성 |
| `ai_crawler_access` | AI 크롤러 접근성 | GPTBot 등 AI 크롤러의 접근 허용/차단 |
| `trust_quality` | 신뢰·품질 신호 | E-E-A-T 등 신뢰도 신호 |
| `rendering_access` | 렌더링·기술 접근성 | JS 렌더링 등 AI 크롤러의 기술적 접근성 |

`structured_markup`/`citability`는 원래 `traditional_seo`/`geo_strategy`에 있던
`structured data`/`schema markup`/`citation`/`cited by ai`/`retrieval augmented generation`을
더 구체적인 그룹으로 이동시켜 흡수한 것 (겹치는 키워드는 병합, 겹치지 않는 나머지는 그대로 구별).

### 4.2 AI 검색 플랫폼 (`ai_platform`)
| 키워드 | 가중치 |
|--------|--------|
| ai overview | 4 |
| ai overviews | 4 |
| ai mode | 4 |
| chatgpt search | 4 |
| perplexity | 3 |
| google gemini | 2 |

### 4.3 GEO/AEO 최적화 전략 (`geo_strategy`)
| 키워드 | 가중치 |
|--------|--------|
| generative engine optimization | 5 |
| answer engine optimization | 5 |
| llm seo | 5 |
| ai search | 4 |
| geo | 3 |
| agentic optimization | 3 |

### 4.4 측정·모니터링 도구 (`measurement_tools`)
| 키워드 | 가중치 |
|--------|--------|
| ai visibility | 3 |
| share of voice | 3 |
| geo tool | 3 |
| prompt monitoring | 2 |
| ai search tracking | 2 |

### 4.5 전통 SEO·검색엔진 (`traditional_seo`)
| 키워드 | 가중치 |
|--------|--------|
| core update | 4 |
| serp | 3 |
| algorithm update | 3 |
| featured snippet | 3 |
| search engine | 2 |
| seo | 2 |
| ranking | 2 |
| organic traffic | 2 |
| google search | 3 |

### 4.6 시장·비즈니스 임팩트 (`market_impact`)
| 키워드 | 가중치 |
|--------|--------|
| ai ads | 3 |
| zero click | 3 |
| ad revenue | 2 |
| traffic decline | 2 |
| click through rate | 2 |

### 4.7 구조화 데이터/마크업 (`structured_markup`)
| 키워드 | 가중치 |
|--------|--------|
| structured data | 2 |
| schema markup | 2 |
| schema.org | 3 |
| json-ld | 3 |
| rich results | 3 |
| rich result | 3 |
| rich snippet | 3 |
| faq schema | 3 |
| howto schema | 3 |
| semantic html | 3 |
| entity markup | 3 |

### 4.8 콘텐츠 구조/추출성 (`content_extractability`)
| 키워드 | 가중치 |
|--------|--------|
| content structure | 2 |
| heading structure | 2 |
| header hierarchy | 3 |
| direct answer | 3 |
| answer format | 3 |
| passage ranking | 4 |
| content chunk | 3 |
| chunking | 3 |
| skimmable | 3 |
| scannable | 3 |
| tl;dr | 2 |

### 4.9 엔티티/시맨틱 (`entity_semantic`)
| 키워드 | 가중치 |
|--------|--------|
| entity seo | 4 |
| entity-based | 3 |
| named entity | 3 |
| knowledge graph | 3 |
| topical authority | 3 |
| topic cluster | 3 |
| semantic search | 3 |
| disambiguation | 3 |

### 4.10 인용/검색가능성 (`citability`)
| 키워드 | 가중치 |
|--------|--------|
| citation | 2 |
| cited by ai | 4 |
| retrievability | 4 |
| retrieval augmented generation | 4 |
| source attribution | 3 |
| quotability | 3 |
| quotable | 3 |
| extractability | 3 |
| extractable | 3 |
| fact density | 3 |
| llms.txt | 5 |

### 4.11 AI 크롤러 접근성 (`ai_crawler_access`)
| 키워드 | 가중치 |
|--------|--------|
| ai crawler | 4 |
| gptbot | 4 |
| claudebot | 4 |
| perplexitybot | 4 |
| google-extended | 4 |
| ai.txt | 4 |

### 4.12 신뢰·품질 신호 (`trust_quality`)
| 키워드 | 가중치 |
|--------|--------|
| e-e-a-t | 3 |
| eeat | 3 |
| original research | 3 |
| authorship | 2 |

### 4.13 렌더링·기술 접근성 (`rendering_access`)
| 키워드 | 가중치 |
|--------|--------|
| javascript rendering | 3 |
| client-side rendering | 3 |
| server-side rendering | 3 |
| dynamic rendering | 3 |
| prerendering | 3 |
| pre-rendering | 3 |
| hydration | 2 |
| indexability | 3 |
| crawlability | 3 |
| crawl budget | 3 |
| rendered html | 3 |
| raw html | 3 |

## 5. DB 스키마

Supabase(Postgres)에 아래를 적용. 중복 차단의 핵심은 `items.url_hash`의 **UNIQUE** 제약,
주차 중복 차단의 핵심은 `digests.week`의 **UNIQUE** 제약(둘 다 upsert 대상).

```sql
create table sources (
  id         bigint generated always as identity primary key,
  name       text not null,
  feed_url   text not null,
  tier       text check (tier in ('primary','trade','broad')),
  created_at timestamptz default now()
);

create table items (
  id               bigint generated always as identity primary key,
  url              text not null,
  url_hash         text not null unique,        -- 중복 차단 핵심
  title            text not null,
  source           text,
  tier             text,
  published_at     timestamptz,
  matched_keywords text[],
  relevance_score  int,
  raw_summary      text,                         -- 피드 원본 요약(정제)
  categories       text[],                        -- 그룹 태그 (§4.1, multi-tag), collect.py가 채움
  -- 아래는 주간 요약 배치에서 채움
  summary          text,                         -- Claude 3줄 요약
  cluster          text,                         -- 세부 주제 클러스터
  insight          text,                         -- 클라이언트 시사점
  relevant         boolean,                      -- Claude의 관련도 재평가 (false면 노이즈 판단)
  collected_at     timestamptz default now()
);

create table digests (
  id                 bigint generated always as identity primary key,
  week               text not null unique,        -- 예: '2026-W29', upsert 기준
  headline_items     bigint[],                     -- items.id 참조
  overview           text,                         -- 주간 총평
  category_insights  jsonb,                        -- {"AI 검색 플랫폼": "2~3문장 총평", ...}
  created_at         timestamptz default now()
);

create index items_published_idx on items (published_at desc);
create index items_cluster_idx on items (cluster);
create index items_categories_idx on items using gin (categories);

create table requests (
  id         bigint generated always as identity primary key,
  content    text not null,
  author     text,                                 -- 작성자 이름(선택, 익명 허용)
  status     text not null default '요청'
             check (status in ('요청', '진행 중', '완료')),
  created_at timestamptz default now()
);

create table ai_usage (
  id           bigint generated always as identity primary key,
  week         text not null,                       -- '2026-W29' 형식, digests.week와 동일 규칙
  provider     text not null,                        -- 모델 슬러그의 "/" 앞부분 (anthropic, openai, ...)
  total_tokens bigint not null,
  share_pct    numeric not null,
  created_at   timestamptz default now(),
  unique (week, provider)
);

create table ai_active_models (
  id          bigint generated always as identity primary key,
  provider    text not null,
  model_id    text not null unique,                  -- OpenRouter 모델 슬러그
  name        text not null,
  released_at timestamptz,
  fetched_at  timestamptz default now()
);
```

> 참고: v1은 `sources.yaml`을 소스 원본(source of truth)으로 두고, `sources` 테이블은
> 대시보드 표시용으로만 써도 됨. 팀이 UI에서 소스를 관리하고 싶어지면 그때 테이블로 일원화.
>
> **RLS 필수**: `items`, `digests` 모두 `enable row level security` 후 anon 읽기 정책
> (`for select using (true)`)을 추가해야 대시보드(anon 키)가 조회할 수 있다. 자세한 사연은
> [`ISSUES.md`](./ISSUES.md) 3단계 항목 참고.
>
> **`requests`는 예외적으로 anon 쓰기(수정·삭제 포함)까지 전부 허용**한다 (12명 규모 사내 도구,
> 신뢰 기반 - 인증 없이 대시보드에서 누구나 요청을 등록·수정·삭제하고 상태를 바꿀 수 있게 하는
> 게 목적. 남용 리스크보다 인증 붙이는 복잡도가 더 크다고 판단):
> ```sql
> alter table requests enable row level security;
> create policy "requests_select_anon" on requests for select using (true);
> create policy "requests_insert_anon" on requests for insert with check (true);
> create policy "requests_update_anon" on requests for update using (true) with check (true);
> create policy "requests_delete_anon" on requests for delete using (true);
> ```
>
> **`ai_usage`/`ai_active_models`는 `items`/`digests`와 동일하게 읽기만 공개**한다 (쓰기는
> `src/collect_ai_usage.py`가 매주 service_role로만):
> ```sql
> alter table ai_usage enable row level security;
> create policy "ai_usage_select_anon" on ai_usage for select using (true);
>
> alter table ai_active_models enable row level security;
> create policy "ai_active_models_select_anon" on ai_active_models for select using (true);
> ```

## 6. 프로토타입 산출물 (참고 구현)

레포에 실제 동작하는 구현이 포함되어 있음 (전 단계 완료, [`BUILD-GUIDE.md`](./BUILD-GUIDE.md) 참고):
- [`src/collect.py`](../src/collect.py) — 수집→필터→카테고리 분류→Supabase upsert. §3~4 규칙이 그대로 구현됨.
- [`src/summarize.py`](../src/summarize.py) — 요약·클러스터링·헤드라인·카테고리별 인사이트 생성.
- [`src/store.py`](../src/store.py) — Supabase 저장 레이어 공용 모듈.
- 로컬 실행: `python -m venv .venv && .venv/Scripts/pip install -r requirements.txt && .venv/Scripts/python src/collect.py`

> 키워드·소스 리스트는 트렌드 변화에 따라 주기적으로 업데이트가 필요함 (신규 대분류/키워드 추가 등).