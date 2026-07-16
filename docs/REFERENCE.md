# GEO Trend Radar — 레퍼런스 자료 정리본

> 소스 · 키워드 · 필터 규칙 · DB 스키마. 빌더가 그대로 사용/확장하면 됨.
> 실제 설정 파일: 레포 루트의 [`sources.yaml`](../sources.yaml), [`keywords.yaml`](../keywords.yaml)

## 1. 소스 리스트 (12개, 전부 RSS 작동 확인 완료)

`type: rss` · 등급(tier)은 노이즈 비율에 따른 분류 → 등급별 threshold 적용(§3).

### primary — 공식 1차 출처 (느슨하게, 놓치지 않게)
| 소스 | feed URL | 성격 |
|------|----------|------|
| Google Search Central Blog | `https://developers.google.com/search/blog/feed.xml` | 구글 검색 공식 발표 (SEO 실무 직결) |
| Google Search Product Blog | `https://blog.google/products/search/rss/` | AI Mode·AI Overviews 등 검색 제품 발표 |

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

## 4. 키워드 + 가중치 전체 리스트

GEO 핵심은 고가중치, SEO 일반은 중·저가중치. (`keywords.yaml` 원본과 동일)

### GEO 핵심
| 키워드 | 가중치 |
|--------|--------|
| generative engine optimization | 5 |
| answer engine optimization | 5 |
| llm seo | 5 |
| ai overview | 4 |
| ai overviews | 4 |
| ai search | 4 |
| ai mode | 4 |
| chatgpt search | 4 |
| cited by ai | 4 |
| geo | 3 |
| perplexity | 3 |
| google gemini | 2 |
| citation | 2 |

### SEO 일반
| 키워드 | 가중치 |
|--------|--------|
| core update | 4 |
| google search | 3 |
| serp | 3 |
| algorithm update | 3 |
| featured snippet | 3 |
| seo | 2 |
| search engine | 2 |
| ranking | 2 |
| organic traffic | 2 |
| structured data | 2 |
| schema markup | 2 |

> **튜닝 메모**: `google search`(가중치 3)는 소비자성 구글 글까지 잡는 경향이 있음.
> primary 소스에서 노이즈가 보이면 이 키워드 가중치를 2로 낮추는 것을 우선 고려.

## 5. DB 스키마

Supabase(Postgres)에 아래를 적용. 중복 차단의 핵심은 `items.url_hash`의 **UNIQUE** 제약.

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
  -- 아래는 주간 요약 배치에서 채움
  summary          text,                         -- Claude 3줄 요약
  cluster          text,                         -- 주제 클러스터
  insight          text,                         -- 클라이언트 시사점
  collected_at     timestamptz default now()
);

create table digests (
  id             bigint generated always as identity primary key,
  week           text not null,                  -- 예: '2026-W29'
  headline_items bigint[],                        -- items.id 참조
  created_at     timestamptz default now()
);

create index items_published_idx on items (published_at desc);
create index items_cluster_idx on items (cluster);
```

> 참고: v1은 `sources.yaml`을 소스 원본(source of truth)으로 두고, `sources` 테이블은
> 대시보드 표시용으로만 써도 됨. 팀이 UI에서 소스를 관리하고 싶어지면 그때 테이블로 일원화.

## 6. 프로토타입 산출물 (참고 구현)

빌더가 참고할 수 있는 **1단계 동작 구현**이 레포에 포함됨:
- [`src/collect.py`](../src/collect.py) — 수집→필터→중복제거→`data/items.json`. §3~4 규칙이 그대로 구현됨.
- 로컬 실행: `python -m venv .venv && .venv/Scripts/pip install -r requirements.txt && .venv/Scripts/python src/collect.py`
- 이 스크립트의 저장 대상(`data/items.json`)을 Supabase upsert로 바꾸면 3단계로 넘어감.
```
