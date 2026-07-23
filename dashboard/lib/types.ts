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
  categories: string[] | null;
};

export type Digest = {
  id: number;
  week: string;
  headline_items: number[] | null;
  overview: string | null;
  category_insights: Record<string, string> | null;
  created_at: string;
};

export type RequestStatus = "요청" | "진행 중" | "완료";

export type RequestItem = {
  id: number;
  content: string;
  author: string | null;
  status: RequestStatus;
  created_at: string;
};

export type AiUsageRow = {
  id: number;
  week: string;
  provider: string;
  total_tokens: number;
  share_pct: number;
  created_at: string;
};

export type ModelDetails = {
  context_length: number | null;
  pricing: { prompt: string | null; completion: string | null };
  modality: string | null;
  knowledge_cutoff: string | null;
  reasoning_supported: boolean;
};

export type ActiveModel = {
  id: number;
  provider: string;
  model_id: string;
  name: string;
  released_at: string | null;
  fetched_at: string;
  details: ModelDetails | null;
};
