/** Get HTTP status color */
export const getStatusColor = (code: number): string => {
  if (code >= 200 && code < 300) return '#10b981';
  if (code >= 400 && code < 500) return '#f59e0b';
  return '#f43f5e';
};

/** Format response time */
export const formatLatency = (ms: number): string => ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
