import apiClient from '@modules/core/lib/apiClient';

export interface UserItem {
  id: string;
  email: string;
  full_name: string;
  roles: string[];
  is_active: boolean;
}

export const userService = {
  getUsers: async (): Promise<UserItem[]> => {
    const res = await apiClient.get<UserItem[]>('/users');
    return res.data;
  },
};

export default userService;
