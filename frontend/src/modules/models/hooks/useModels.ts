import { useState, useEffect } from 'react';
import { modelService, type ModelItem } from '../services/modelService';

export const useModels = () => {
  const [models, setModels] = useState<ModelItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    modelService
      .getModels()
      .then((data) => {
        if (mounted) setModels(data);
      })
      .catch(() => {})
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { models, loading };
};

export default useModels;
