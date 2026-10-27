import { create } from 'zustand';

interface ModelsState { filterType: string; filterProvider: string; setFilterType: (v: string) => void; setFilterProvider: (v: string) => void; }
export const useModelsStore = create<ModelsState>((set) => ({ filterType: 'all', filterProvider: 'all', setFilterType: (v) => set({ filterType: v }), setFilterProvider: (v) => set({ filterProvider: v }) }));
