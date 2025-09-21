import { useState, useEffect } from 'react';
import { getLandingStats, LandingStats } from '../services/landingService';

export const useLandingStats = () => {
  const [stats, setStats] = useState<LandingStats>({
    totalUserCount: 0,
    totalTeamCount: 0,
    completeTeamCount: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getLandingStats();
      setStats(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '통계를 불러오는데 실패했습니다.'
      );
      console.error('Landing 통계 조회 에러:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
  };
};
