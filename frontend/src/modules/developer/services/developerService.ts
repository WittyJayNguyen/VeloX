/**
 * VeloX AI Gateway — Developer API Keys HTTP Client Service
 */
import apiClient from '@modules/core/lib/apiClient';
import type { DeveloperApiKey, DeveloperApiKeyCreated, CreateApiKeyRequest } from '../types';

export const developerService = {
  /**
   * Fetch all API keys owned by current developer
   */
  async listKeys(): Promise<DeveloperApiKey[]> {
    const res = await apiClient.get<DeveloperApiKey[]>('/developer/keys');
    return res.data;
  },

  /**
   * Create a new API key (returns secret_key once)
   */
  async createKey(payload: CreateApiKeyRequest): Promise<DeveloperApiKeyCreated> {
    const res = await apiClient.post<DeveloperApiKeyCreated>('/developer/keys', payload);
    return res.data;
  },

  /**
   * Toggle key active status
   */
  async toggleKey(keyId: string, isActive: boolean): Promise<DeveloperApiKey> {
    const res = await apiClient.patch<DeveloperApiKey>(`/developer/keys/${keyId}/toggle`, null, {
      params: { is_active: isActive },
    });
    return res.data;
  },

  /**
   * Revoke (permanently delete) key
   */
  async revokeKey(keyId: string): Promise<void> {
    await apiClient.delete(`/developer/keys/${keyId}`);
  },
};
