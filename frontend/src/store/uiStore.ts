import { create } from 'zustand';

interface UIStore {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  language: string;
  setLanguage: (lang: string) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  language: localStorage.getItem('velox_lang') || 'vi',
  setLanguage: (lang) => {
    localStorage.setItem('velox_lang', lang);
    set({ language: lang });
  },
}));
