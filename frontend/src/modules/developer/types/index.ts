/**
 * VeloX AI Gateway — Developer API Keys Data Models
 */

export interface DeveloperApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  is_active: boolean;
  rate_limit_per_min: number;
  total_requests: number;
  last_used_at?: string;
  created_at?: string;
}

export interface DeveloperApiKeyCreated extends DeveloperApiKey {
  secret_key: string;
}

export interface CreateApiKeyRequest {
  name: string;
  rate_limit_per_min?: number;
}
