import apiClient from '@modules/core/lib/apiClient';
import type {
  PlaygroundRequestPayload,
  PlaygroundResponseData,
  PlaygroundKeyOption,
  ConnectionTestResult,
} from '../types/playground.types';

export const playgroundService = {
  // Execute a test prompt
  sendPrompt: async (payload: PlaygroundRequestPayload): Promise<PlaygroundResponseData> => {
    const res = await apiClient.post<PlaygroundResponseData>('/playground/chat', payload, {
      timeout: 0, // Không giới hạn timeout phía Client, chờ đến khi bên Muse trả kết quả xong
    });
    return res.data;
  },

  // Test live connection of a key (e.g. Meta AI session)
  testConnection: async (keyId: string): Promise<ConnectionTestResult> => {
    const res = await apiClient.post<ConnectionTestResult>('/playground/test-connection', { key_id: keyId });
    return res.data;
  },

  // Get all available keys
  getKeys: async (): Promise<PlaygroundKeyOption[]> => {
    const res = await apiClient.get<PlaygroundKeyOption[]>('/playground/keys');
    return res.data;
  },
};
