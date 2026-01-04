import { getWeeklyStats, getWeekStart, parseISODate, toISODateString } from '@/services/storageService';
import { ComparisonPeriod, WeeklyStats } from '@/types/data';
import { useCallback, useEffect, useState } from 'react';

export const useWeeklyAnalytics = (weekStartDate?: Date, comparisonPeriod: ComparisonPeriod = '1w') => {
  const [stats, setStats] = useState<WeeklyStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => {
    const date = weekStartDate || new Date();
    return toISODateString(getWeekStart(date));
  });

  const loadStats = useCallback(async (weekStart: string, period: ComparisonPeriod) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeeklyStats(weekStart, period);
      setStats(data);
    } catch (err) {
      setError('Failed to load weekly stats');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats(currentWeekStart, comparisonPeriod);
  }, [currentWeekStart, comparisonPeriod, loadStats]);

  const navigateToWeek = useCallback((weekStart: string) => {
    setCurrentWeekStart(weekStart);
  }, []);

  const goToPreviousWeek = useCallback(() => {
    const current = parseISODate(currentWeekStart);
    current.setDate(current.getDate() - 7);
    setCurrentWeekStart(toISODateString(getWeekStart(current)));
  }, [currentWeekStart]);

  const goToNextWeek = useCallback(() => {
    const current = parseISODate(currentWeekStart);
    current.setDate(current.getDate() + 7);
    setCurrentWeekStart(toISODateString(getWeekStart(current)));
  }, [currentWeekStart]);

  const goToCurrentWeek = useCallback(() => {
    setCurrentWeekStart(toISODateString(getWeekStart(new Date())));
  }, []);

  const refresh = useCallback(() => {
    loadStats(currentWeekStart, comparisonPeriod);
  }, [currentWeekStart, comparisonPeriod, loadStats]);

  return {
    stats,
    loading,
    error,
    currentWeekStart,
    navigateToWeek,
    goToPreviousWeek,
    goToNextWeek,
    goToCurrentWeek,
    refresh,
  };
};
