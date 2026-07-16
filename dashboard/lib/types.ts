export type Item = {
  id: number;
  url: string;
  url_hash: string;
  title: string;
  source: string | null;
  tier: string | null;
  published_at: string | null;
  matched_keywords: string[] | null;
  relevance_score: number | null;
  raw_summary: string | null;
  summary: string | null;
  cluster: string | null;
  insight: string | null;
  collected_at: string | null;
  relevant: boolean | null;
};

export type Digest = {
  id: number;
  week: string;
  headline_items: number[] | null;
  overview: string | null;
  created_at: string;
};
