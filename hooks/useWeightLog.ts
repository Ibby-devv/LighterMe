import {
    deleteWeightEntry,
    getWeightEntries,
    getWeightEntryForDate,
    saveWeightEntry,
    updateWeightEntry,
} from '@/services/storageService';
import { WeightEntry } from '@/types/data';
import { useCallback, useEffect, useState } from 'react';

export const useWeightLog = () => {
  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWeightEntries();
      setEntries(data);
    } catch (err) {
      setError('Failed to load weight entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (date: string, weight: number, notes?: string) => {
    setError(null);
    try {
      const newEntry = await saveWeightEntry({ date, weight, notes });
      setEntries((prev) => [...prev, newEntry].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      return newEntry;
    } catch (err) {
      setError('Failed to save weight entry');
      console.error(err);
      return null;
    }
  }, []);

  const editEntry = useCallback(async (id: string, updates: Partial<WeightEntry>) => {
    setError(null);
    try {
      const updated = await updateWeightEntry(id, updates);
      if (updated) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? updated : e))
        );
      }
      return updated;
    } catch (err) {
      setError('Failed to update weight entry');
      console.error(err);
      return null;
    }
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteWeightEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete weight entry');
      console.error(err);
      return false;
    }
  }, []);

  const getEntryForDate = useCallback(async (date: string) => {
    try {
      return await getWeightEntryForDate(date);
    } catch (err) {
      console.error(err);
      return null;
    }
  }, []);

  return {
    entries,
    loading,
    error,
    addEntry,
    editEntry,
    removeEntry,
    getEntryForDate,
    refresh: loadEntries,
  };
};
