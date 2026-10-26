import { useState, useEffect } from 'react';
import { billingService, type TransactionItem } from '../services/billingService';

export const useBilling = () => {
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    billingService
      .getTransactions()
      .then((data) => {
        if (mounted) setTransactions(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { transactions, loading };
};

export default useBilling;
