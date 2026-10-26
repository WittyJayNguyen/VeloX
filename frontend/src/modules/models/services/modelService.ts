import apiClient from '@modules/core/lib/apiClient';

export interface ModelItem {
  id: string;
  name: string;
  category: string;
  cost_multiplier: number;
  is_active: boolean;
}

export const modelService = {
  getModels: async (): Promise<ModelItem[]> => {
    const res = await apiClient.get<ModelItem[]>('/models');
    return res.data;
  },
};

export default modelService;
