import { create } from 'zustand';

interface PoolsState { selectedPoolId: string | null; setSelectedPoolId: (id: string | null) => void; }
export const usePoolsStore = create<PoolsState>((set) => ({ selectedPoolId: null, setSelectedPoolId: (id) => set({ selectedPoolId: id }) }));
