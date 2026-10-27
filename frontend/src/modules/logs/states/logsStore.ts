import { create } from 'zustand';

interface LogsState { filterLevel: string; filterModel: string; setFilterLevel: (v: string) => void; setFilterModel: (v: string) => void; }
export const useLogsStore = create<LogsState>((set) => ({ filterLevel: 'all', filterModel: '', setFilterLevel: (v) => set({ filterLevel: v }), setFilterModel: (v) => set({ filterModel: v }) }));
