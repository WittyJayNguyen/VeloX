import { create } from 'zustand';

interface AdminState {
  isMaintenanceMode: boolean;
  sidebarSection: string;
  setMaintenanceMode: (v: boolean) => void;
  setSidebarSection: (section: string) => void;
}

export const useAdminStore = create<AdminState>((set) => ({
  isMaintenanceMode: false,
  sidebarSection: 'dashboard',
  setMaintenanceMode: (v) => set({ isMaintenanceMode: v }),
  setSidebarSection: (section) => set({ sidebarSection: section }),
}));
