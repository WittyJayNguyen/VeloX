import { create } from 'zustand';

interface HomeState {
  activeFeature: number | null;
  setActiveFeature: (idx: number | null) => void;
}

export const useHomeStore = create<HomeState>((set) => ({
  activeFeature: null,
  setActiveFeature: (idx) => set({ activeFeature: idx }),
}));
