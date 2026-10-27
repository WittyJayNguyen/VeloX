/**
 * VeloX AI Gateway — User Media Library Types
 */

export interface MediaJob {
  id: string;
  user_id?: string;
  model_id?: string;
  media_type: 'IMAGE' | 'VIDEO';
  prompt: string;
  output_url?: string;
  credits_charged: number;
  render_seconds?: number;
  created_at?: string;
}

export interface MediaJobListResponse {
  items: MediaJob[];
  total: number;
  page: number;
  page_size: number;
}
