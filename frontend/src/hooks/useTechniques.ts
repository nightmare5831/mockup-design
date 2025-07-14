import { useState, useEffect } from 'react';
import { mockupsApi } from '@/service/api';
import { MockupTechniqueInfo } from '@/types';

interface UseTechniquesReturn {
  techniques: MockupTechniqueInfo[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const useTechniques = (): UseTechniquesReturn => {
  const [techniques, setTechniques] = useState<MockupTechniqueInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTechniques = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await mockupsApi.getMarkingTechniques();
      setTechniques(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch marking techniques');
      console.error('Error fetching techniques:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechniques();
  }, []);

  return {
    techniques,
    loading,
    error,
    refetch: fetchTechniques
  };
};