import apiClient from '@modules/core/lib/apiClient';

export interface ServicePoolItem {
  id: string;
  name: string;
  provider: string;
  auth_type: string;
  is_active: boolean;
}

export const poolService = {
  getPools: async (): Promise<ServicePoolItem[]> => {
    const res = await apiClient.get<ServicePoolItem[]>('/pools');
    return res.data;
  },
};

export default poolService;
