import { useState, useEffect } from 'react';
import { logService, type LogItem } from '../services/logService';

export const useLogs = () => {
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    logService
      .getLogs()
      .then((data: LogItem[]) => {
        if (mounted) setLogs(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { logs, loading };
};

export default useLogs;
