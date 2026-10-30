import apiClient from '@modules/core/lib/apiClient';

export interface LandingSection<T = Record<string, any>> {
  id: string;
  section_key: string;
  title: string;
  order: number;
  is_active: boolean;
  content: T;
  created_at?: string;
  updated_at?: string;
}

export interface ReorderSectionItem {
  id: string;
  order: number;
}

export interface CreateLandingSectionPayload {
  section_key: string;
  title: string;
  order?: number;
  is_active?: boolean;
  content?: Record<string, any>;
}

export interface UpdateLandingSectionPayload {
  title?: string;
  is_active?: boolean;
  order?: number;
  content?: Record<string, any>;
}

export const landingService = {
  /**
   * Get public active sections for home page, ordered by order
   */
  getPublicLandingSections: async (): Promise<LandingSection[]> => {
    try {
      const res = await apiClient.get<LandingSection[]>('/system/landing');
      return res.data;
    } catch (err) {
      console.error('Failed to fetch public landing sections:', err);
      return [];
    }
  },

  /**
   * Get all sections for Admin management
   */
  getAdminLandingSections: async (): Promise<LandingSection[]> => {
    const res = await apiClient.get<LandingSection[]>('/system/landing/admin');
    return res.data;
  },

  /**
   * Reorder landing sections
   */
  reorderSections: async (sections: ReorderSectionItem[]): Promise<LandingSection[]> => {
    const res = await apiClient.put<LandingSection[]>('/system/landing/admin/reorder', { sections });
    return res.data;
  },

  /**
   * Create a new custom section
   */
  createSection: async (payload: CreateLandingSectionPayload): Promise<LandingSection> => {
    const res = await apiClient.post<LandingSection>('/system/landing/admin/sections', payload);
    return res.data;
  },

  /**
   * Update an existing section (content, title, is_active, order)
   */
  updateSection: async (id: string, payload: UpdateLandingSectionPayload): Promise<LandingSection> => {
    const res = await apiClient.put<LandingSection>(`/system/landing/admin/sections/${id}`, payload);
    return res.data;
  },

  /**
   * Delete a section
   */
  deleteSection: async (id: string): Promise<boolean> => {
    const res = await apiClient.delete<{ success: boolean }>(`/system/landing/admin/sections/${id}`);
    return res.data.success;
  },

  /**
   * Reset landing sections to initial default template
   */
  resetSections: async (): Promise<LandingSection[]> => {
    const res = await apiClient.post<LandingSection[]>('/system/landing/admin/reset');
    return res.data;
  },
};
