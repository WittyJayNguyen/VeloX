import apiClient from '@modules/core/lib/apiClient';

// ── Types ──
export interface GatewayLogDto {
  id: string;
  timestamp: string;
  user_email: string;
  model_code: string;
  pool_id: string;
  status_code: number;
  latency_ms: number;
  tokens_used: number;
  credits_charged: number;
  ip_address: string;
  error_message?: string;
}

export interface LogFilterParams {
  search?: string;
  status?: 'ALL' | 'SUCCESS' | 'ERROR';
  model?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export type LogItem = GatewayLogDto;

// ── Offline fallback ──
const STORAGE_KEY = 'velox_gateway_logs';
const getLocal = (): GatewayLogDto[] => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
};
const saveLocal = (d: GatewayLogDto[]) => localStorage.setItem(STORAGE_KEY, JSON.stringify(d));

// ── Service ──
export const logService = {
  getLogs: async (filters?: LogFilterParams): Promise<GatewayLogDto[]> => {
    return logService.getAll(filters);
  },

  getAll: async (filters?: LogFilterParams): Promise<GatewayLogDto[]> => {
    try {
      const res = await apiClient.get<GatewayLogDto[]>('/logs', { params: filters });
      saveLocal(res.data);
      return res.data;
    } catch {
      let logs = getLocal();
      if (filters?.search) {
        const q = filters.search.toLowerCase();
        logs = logs.filter((l) =>
          l.user_email.toLowerCase().includes(q) ||
          l.model_code.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
        );
      }
      if (filters?.status === 'SUCCESS') logs = logs.filter((l) => l.status_code >= 200 && l.status_code < 300);
      if (filters?.status === 'ERROR') logs = logs.filter((l) => l.status_code >= 400);
      return logs;
    }
  },

  getById: async (id: string): Promise<GatewayLogDto | undefined> => {
    try {
      const res = await apiClient.get<GatewayLogDto>(`/logs/${id}`);
      return res.data;
    } catch { return getLocal().find((l) => l.id === id); }
  },

  exportJson: (logs: GatewayLogDto[]): void => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velox_logs_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  exportCsv: (logs: GatewayLogDto[]): void => {
    const headers = ['ID', 'Timestamp', 'User', 'Model', 'Status', 'Latency(ms)', 'Tokens', 'Credits', 'IP'];
    const rows = logs.map((l) => [l.id, l.timestamp, l.user_email, l.model_code, l.status_code, l.latency_ms, l.tokens_used, l.credits_charged, l.ip_address]);
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `velox_logs_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },

  clearOldLogs: async (beforeDate: string): Promise<number> => {
    try {
      const res = await apiClient.delete<{ deleted: number }>('/logs/cleanup', { params: { before: beforeDate } });
      return res.data.deleted;
    } catch {
      const before = new Date(beforeDate).getTime();
      const all = getLocal();
      const remaining = all.filter((l) => new Date(l.timestamp).getTime() >= before);
      const deleted = all.length - remaining.length;
      saveLocal(remaining);
      return deleted;
    }
  },

  getStats: async () => {
    try {
      const res = await apiClient.get('/logs/stats');
      return res.data;
    } catch {
      const logs = getLocal();
      return {
        total: logs.length,
        success: logs.filter((l) => l.status_code < 400).length,
        errors: logs.filter((l) => l.status_code >= 400).length,
        avg_latency: logs.length > 0 ? Math.round(logs.reduce((a, l) => a + l.latency_ms, 0) / logs.length) : 0,
      };
    }
  },
};

export default logService;
