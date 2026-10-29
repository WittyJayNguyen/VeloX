/**
 * VeloX AI Gateway — User Media Library HTTP Client
 */
import apiClient from '@modules/core/lib/apiClient';
import type { MediaJobListResponse } from '../types';

export const libraryService = {
  /**
   * Fetch current user's generated media jobs (tenant-isolated)
   */
  async getMyJobs(params: {
    media_type?: string;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<MediaJobListResponse> {
    const res = await apiClient.get<MediaJobListResponse>('/logs/my-jobs', {
      params: {
        media_type: params.media_type === 'ALL' ? undefined : params.media_type,
        search: params.search || undefined,
        page: params.page || 1,
        page_size: params.page_size || 12,
      },
    });
    return res.data;
  },

  /**
   * Delete a media item from user's personal history
   */
  async deleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`/logs/my-jobs/${jobId}`);
  },

  /**
   * Admin: Fetch all users' generated prompts and media across entire system
   */
  async getAllJobs(params: {
    media_type?: string;
    model_id?: string;
    has_media_only?: boolean;
    search?: string;
    page?: number;
    page_size?: number;
  }): Promise<MediaJobListResponse> {
    const res = await apiClient.get<MediaJobListResponse>('/logs/all-media', {
      params: {
        media_type: params.media_type === 'ALL' ? undefined : params.media_type,
        model_id: params.model_id === 'ALL' ? undefined : params.model_id,
        has_media_only: params.has_media_only || undefined,
        search: params.search || undefined,
        page: params.page || 1,
        page_size: params.page_size || 24,
      },
    });
    return res.data;
  },

  /**
   * Admin: Get stats for Master Prompt & Media Vault
   */
  async getVaultStats(): Promise<import('../types').MediaVaultStats> {
    const res = await apiClient.get<import('../types').MediaVaultStats>('/logs/media-vault/stats');
    return res.data;
  },

  /**
   * Admin: Delete any media item from system vault
   */
  async adminDeleteJob(jobId: string): Promise<void> {
    await apiClient.delete(`/logs/all-media/${jobId}`);
  },
};

