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
};
