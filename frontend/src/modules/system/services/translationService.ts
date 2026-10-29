import apiClient from '@modules/core/lib/apiClient';

export interface TranslationItem {
  key: string;
  category: string;
  vi: string;
  en: string;
  zh: string;
  ja: string;
  ko: string;
  updated_at?: string;
}

export interface TranslationListResponse {
  items: TranslationItem[];
  total: number;
  page: number;
  page_size: number;
  categories: string[];
}

export interface TranslationBundleResponse {
  status: string;
  bundle: {
    vi: Record<string, unknown>;
    en: Record<string, unknown>;
    zh: Record<string, unknown>;
    ja: Record<string, unknown>;
    ko: Record<string, unknown>;
  };
}

export const translationService = {
  async getTranslations(params: {
    search?: string;
    category?: string;
    page?: number;
    page_size?: number;
  }): Promise<TranslationListResponse> {
    const res = await apiClient.get<TranslationListResponse>('/system/translations', {
      params: {
        search: params.search || undefined,
        category: params.category === 'ALL' ? undefined : params.category,
        page: params.page || 1,
        page_size: params.page_size || 20,
      },
    });
    return res.data;
  },

  async updateTranslation(
    key: string,
    data: {
      vi?: string;
      en?: string;
      zh?: string;
      ja?: string;
      ko?: string;
      category?: string;
    }
  ): Promise<{ status: string; message: string; item: TranslationItem }> {
    const res = await apiClient.put(`/system/translations/${encodeURIComponent(key)}`, data);
    return res.data;
  },

  async createTranslation(data: {
    key: string;
    category?: string;
    vi?: string;
    en?: string;
    zh?: string;
    ja?: string;
    ko?: string;
  }): Promise<{ status: string; message: string; item: TranslationItem }> {
    const res = await apiClient.post('/system/translations', data);
    return res.data;
  },

  async deleteTranslation(key: string): Promise<void> {
    await apiClient.delete(`/system/translations/${encodeURIComponent(key)}`);
  },

  async getBundle(): Promise<TranslationBundleResponse> {
    const res = await apiClient.get<TranslationBundleResponse>('/system/translations/bundle');
    return res.data;
  },
};

export default translationService;
