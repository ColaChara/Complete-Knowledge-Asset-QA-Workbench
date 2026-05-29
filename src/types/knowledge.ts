export interface KnowledgeAsset {
  id: string;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
}

export interface SearchResult {
  assetId: string;
  title: string;
  snippet: string;
  score: number;
}

export interface Citation {
  assetId: string;
  title: string;
}

export interface Answer {
  text: string;
  citations: Citation[];
}

export interface TraceStep {
  name: "retrieval" | "ranking" | "generation";
  status: "pending" | "running" | "completed" | "error";
  data?: {
    query?: string;
    results?: SearchResult[];
    scores?: Record<string, number>;
    answer?: string;
  };
}

export interface AgentTrace {
  steps: TraceStep[];
}

export interface ChatState {
  question: string;
  trace: AgentTrace | null;
  answer: Answer | null;
  loading: boolean;
}
