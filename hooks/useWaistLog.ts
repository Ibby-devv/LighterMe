import {
    deleteWaistEntry,
    getWaistEntries,
    getWaistEntryForDate,
    saveWaistEntry,
    updateWaistEntry,
} from '@/services/storageService';
import { WaistEntry } from '@/types/data';
import { useCallback, useEffect, useState } from 'react';

export const useWaistLog = () => {
  const [entries, setEntries] = useState<WaistEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWaistEntries();
      setEntries(data);
    } catch (err) {
      setError('Failed to load waist entries');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const addEntry = useCallback(async (date: string, measurement: number, notes?: string) => {
    setError(null);
    try {
      const newEntry = await saveWaistEntry({ date, measurement, notes });
      setEntries((prev) => [...prev, newEntry].sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      ));
      return newEntry;
    } catch (err) {
      setError('Failed to save waist entry');
      console.error(err);
      return null;
    }
  }, []);

  const editEntry = useCallback(async (id: string, updates: Partial<WaistEntry>) => {
    setError(null);
    try {
      const updated = await updateWaistEntry(id, updates);
      if (updated) {
        setEntries((prev) =>
          prev.map((e) => (e.id === id ? updated : e))
        );
      }
      return updated;
    } catch (err) {
      setError('Failed to update waist entry');
      console.error(err);
      return null;
    }
  }, []);

  const removeEntry = useCallback(async (id: string) => {
    setError(null);
    try {
      await deleteWaistEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      return true;
    } catch (err) {
      setError('Failed to delete waist entry');
      console.error(err);
      return false;
    }
  }, []);

  const getEntryForDate = useCallback(async (date: string) => {
    try {
      return await getWaistEntryForDate(date);
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
