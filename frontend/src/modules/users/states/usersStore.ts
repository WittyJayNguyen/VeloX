import { create } from 'zustand';

interface UsersState { filterRole: string; searchQuery: string; setFilterRole: (v: string) => void; setSearchQuery: (v: string) => void; }
export const useUsersStore = create<UsersState>((set) => ({ filterRole: 'all', searchQuery: '', setFilterRole: (v) => set({ filterRole: v }), setSearchQuery: (v) => set({ searchQuery: v }) }));
