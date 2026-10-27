export interface PlaygroundMessage {
  id: string;
  role: 'system' | 'user' | 'assistant';
  content: string;
  media_url?: string;
  media_urls?: string[];
  timestamp: string;
  latency_ms?: number;
  tokens?: number;
  provider?: string;
  model_code?: string;
  key_name?: string;
  debug_info?: Record<string, any>;
}

export interface PlaygroundRequestPayload {
  model_code: string;
  messages: Array<{ role: string; content: string }>;
  key_id?: string;
  pool_id?: string;
  temperature?: number;
  max_tokens?: number;
  system_prompt?: string;
  stream?: boolean;
  aspect_ratio?: string;
  duration_sec?: number;
  num_outputs?: number;
  quality?: string;
  reference_image?: string;
}

export interface PlaygroundResponseData {
  id: string;
  model_code: string;
  provider: string;
  category: string;
  key_name?: string;
  status: string;
  latency_ms: number;
  content: string;
  media_url?: string;
  media_urls?: string[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
    estimated_cost_vnd: number;
  };
  debug_info: Record<string, any>;
  created_at: string;
}

export interface PlaygroundKeyOption {
  id: string;
  name: string;
  auth_type: string;
  status: string;
  detected_models?: string;
  provider: string;
  pool_name: string;
  quota_daily?: number;
  quota_daily_used?: number;
  quota_monthly?: number;
  quota_monthly_used?: number;
  requests_count?: number;
}

export interface ConnectionTestResult {
  key_name: string;
  provider: string;
  is_live: boolean;
  latency_ms: number;
  status_code: number;
  message: string;
  details: Record<string, any>;
}
