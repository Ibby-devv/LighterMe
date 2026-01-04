import { ComparisonPeriod, WaistEntry, WeeklyStats, WeightEntry } from '@/types/data';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WEIGHT_ENTRIES_KEY = 'weight_entries';
const WAIST_ENTRIES_KEY = 'waist_entries';

// ===== Date Utilities (Monday-based weeks) =====

/**
 * Get the Monday of the week containing the given date
 */
export const getWeekStart = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day; // If Sunday (0), go back 6 days; otherwise go to Monday
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

/**
 * Get the Sunday of the week containing the given date
 */
export const getWeekEnd = (date: Date): Date => {
  const weekStart = getWeekStart(date);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);
  return weekEnd;
};

/**
 * Format date to local ISO-like string (YYYY-MM-DD) using the device's local time zone.
 * Using toISOString() would convert to UTC and can roll the date backward/forward for users
 * outside UTC (e.g., Sydney), so we build the string from local date parts instead.
 */
export const toISODateString = (date: Date): string => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${year}-${pad(month)}-${pad(day)}`;
};

/**
 * Parse ISO date string to Date object
 */
export const parseISODate = (dateString: string): Date => {
  // Construct date in local time to align with toISODateString
  return new Date(dateString + 'T00:00:00');
};

/**
 * Format week range for display (e.g., "Mon, Dec 9 - Sun, Dec 15")
 */
export const formatWeekRange = (weekStart: string): string => {
  const start = parseISODate(weekStart);
  const end = getWeekEnd(start);
  
  const startStr = start.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  });
  const endStr = end.toLocaleDateString('en-US', { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  });
  
  return `${startStr} - ${endStr}`;
};

/**
 * Check if two dates are in the same week
 */
export const isSameWeek = (date1: Date, date2: Date): boolean => {
  const week1Start = getWeekStart(date1);
  const week2Start = getWeekStart(date2);
  return toISODateString(week1Start) === toISODateString(week2Start);
};

// ===== Weight Entry Storage =====

export const getWeightEntries = async (): Promise<WeightEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(WEIGHT_ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading weight entries:', error);
    return [];
  }
};

export const saveWeightEntry = async (entry: Omit<WeightEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<WeightEntry> => {
  try {
    const entries = await getWeightEntries();
    const now = Date.now();
    const newEntry: WeightEntry = {
      ...entry,
      id: `weight_${now}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now,
    };
    entries.push(newEntry);
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(entries));
    return newEntry;
  } catch (error) {
    console.error('Error saving weight entry:', error);
    throw new Error('Failed to save weight entry');
  }
};

export const updateWeightEntry = async (id: string, updates: Partial<WeightEntry>): Promise<WeightEntry | null> => {
  try {
    const entries = await getWeightEntries();
    const index = entries.findIndex((e) => e.id === id);
    if (index === -1) return null;
    
    entries[index] = {
      ...entries[index],
      ...updates,
      id: entries[index].id, // Preserve ID
      createdAt: entries[index].createdAt, // Preserve creation time
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(entries));
    return entries[index];
  } catch (error) {
    console.error('Error updating weight entry:', error);
    throw new Error('Failed to update weight entry');
  }
};

export const deleteWeightEntry = async (id: string): Promise<boolean> => {
  try {
    const entries = await getWeightEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting weight entry:', error);
    throw new Error('Failed to delete weight entry');
  }
};

// ===== Waist Entry Storage =====

export const getWaistEntries = async (): Promise<WaistEntry[]> => {
  try {
    const data = await AsyncStorage.getItem(WAIST_ENTRIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error loading waist entries:', error);
    return [];
  }
};

export const saveWaistEntry = async (entry: Omit<WaistEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<WaistEntry> => {
  try {
    const entries = await getWaistEntries();
    const now = Date.now();
    
    // Check if an entry already exists for this date
    const existingIndex = entries.findIndex((e) => e.date === entry.date);
    
    if (existingIndex !== -1) {
      // Update existing entry
      entries[existingIndex] = {
        ...entries[existingIndex],
        measurement: entry.measurement,
        notes: entry.notes,
        updatedAt: now,
      };
      await AsyncStorage.setItem(WAIST_ENTRIES_KEY, JSON.stringify(entries));
      return entries[existingIndex];
    } else {
      // Create new entry
      const newEntry: WaistEntry = {
        ...entry,
        id: `waist_${now}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now,
      };
      entries.push(newEntry);
      await AsyncStorage.setItem(WAIST_ENTRIES_KEY, JSON.stringify(entries));
      return newEntry;
    }
  } catch (error) {
    console.error('Error saving waist entry:', error);
    throw new Error('Failed to save waist entry');
  }
};

export const updateWaistEntry = async (id: string, updates: Partial<WaistEntry>): Promise<WaistEntry | null> => {
  try {
    const entries = await getWaistEntries();
    const index = entries.findIndex((e) => e.id === id);
    if (index === -1) return null;
    
    entries[index] = {
      ...entries[index],
      ...updates,
      id: entries[index].id,
      createdAt: entries[index].createdAt,
      updatedAt: Date.now(),
    };
    
    await AsyncStorage.setItem(WAIST_ENTRIES_KEY, JSON.stringify(entries));
    return entries[index];
  } catch (error) {
    console.error('Error updating waist entry:', error);
    throw new Error('Failed to update waist entry');
  }
};

export const deleteWaistEntry = async (id: string): Promise<boolean> => {
  try {
    const entries = await getWaistEntries();
    const filtered = entries.filter((e) => e.id !== id);
    await AsyncStorage.setItem(WAIST_ENTRIES_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error deleting waist entry:', error);
    throw new Error('Failed to delete waist entry');
  }
};

// ===== Analytics & Queries =====

/**
 * Get weight entries for a specific week
 */
export const getWeightEntriesForWeek = async (weekStart: string): Promise<WeightEntry[]> => {
  const allEntries = await getWeightEntries();
  const start = parseISODate(weekStart);
  const end = getWeekEnd(start);
  
  return allEntries.filter((entry) => {
    const entryDate = parseISODate(entry.date);
    return entryDate >= start && entryDate <= end;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Get waist entries for a specific week
 */
export const getWaistEntriesForWeek = async (weekStart: string): Promise<WaistEntry[]> => {
  const allEntries = await getWaistEntries();
  const start = parseISODate(weekStart);
  const end = getWeekEnd(start);
  
  return allEntries.filter((entry) => {
    const entryDate = parseISODate(entry.date);
    return entryDate >= start && entryDate <= end;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
};

/**
 * Calculate weekly statistics for weight entries with configurable comparison period
 */
export const getWeeklyStats = async (weekStart: string, comparisonPeriod: ComparisonPeriod = '1w'): Promise<WeeklyStats> => {
  const weekEntries = await getWeightEntriesForWeek(weekStart);
  const waistEntries = await getWaistEntriesForWeek(weekStart);
  
  // Calculate previous week start (7 days before)
  const currentWeekDate = parseISODate(weekStart);
  const previousWeekDate = new Date(currentWeekDate);
  previousWeekDate.setDate(previousWeekDate.getDate() - 7);
  const previousWeekStart = toISODateString(getWeekStart(previousWeekDate));
  
  const previousWeekEntries = await getWeightEntriesForWeek(previousWeekStart);
  const previousWaistEntries = await getWaistEntriesForWeek(previousWeekStart);
  
  // Calculate comparison period week (1w, 2w, or 4w ago)
  const weeksAgo = comparisonPeriod === '1w' ? 1 : comparisonPeriod === '2w' ? 2 : 4;
  const comparisonWeekDate = new Date(currentWeekDate);
  comparisonWeekDate.setDate(comparisonWeekDate.getDate() - (7 * weeksAgo));
  const comparisonWeekStart = toISODateString(getWeekStart(comparisonWeekDate));
  
  let comparisonWeekEntries = await getWeightEntriesForWeek(comparisonWeekStart);
  let comparisonWaistEntries = await getWaistEntriesForWeek(comparisonWeekStart);
  
  // If no data for comparison period, fall back to earliest available data
  if (comparisonWeekEntries.length === 0) {
    const allEntries = await getWeightEntries();
    if (allEntries.length > 0) {
      // Sort by date and get the earliest week
      const sortedEntries = allEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const earliestDate = parseISODate(sortedEntries[0].date);
      const earliestWeekStart = toISODateString(getWeekStart(earliestDate));
      comparisonWeekEntries = await getWeightEntriesForWeek(earliestWeekStart);
    }
  }
  
  if (comparisonWaistEntries.length === 0) {
    const allWaistEntries = await getWaistEntries();
    if (allWaistEntries.length > 0) {
      const sortedEntries = allWaistEntries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const earliestDate = parseISODate(sortedEntries[0].date);
      const earliestWeekStart = toISODateString(getWeekStart(earliestDate));
      comparisonWaistEntries = await getWaistEntriesForWeek(earliestWeekStart);
    }
  }
  
  // Calculate current week stats
  const weights = weekEntries.map((e) => e.weight);
  const weightAverage = weights.length > 0 
    ? weights.reduce((sum, w) => sum + w, 0) / weights.length 
    : null;
  const weightMin = weights.length > 0 ? Math.min(...weights) : null;
  const weightMax = weights.length > 0 ? Math.max(...weights) : null;
  
  // Calculate previous week average
  const previousWeights = previousWeekEntries.map((e) => e.weight);
  const previousWeekAverage = previousWeights.length > 0
    ? previousWeights.reduce((sum, w) => sum + w, 0) / previousWeights.length
    : null;
  
  // Calculate week-over-week change
  const weekOverWeekChange = weightAverage !== null && previousWeekAverage !== null
    ? weightAverage - previousWeekAverage
    : null;
  
  // Calculate comparison period average
  const comparisonWeights = comparisonWeekEntries.map((e) => e.weight);
  const comparisonPeriodAverage = comparisonWeights.length > 0
    ? comparisonWeights.reduce((sum, w) => sum + w, 0) / comparisonWeights.length
    : null;
  
  // Calculate comparison period change
  const comparisonPeriodChange = weightAverage !== null && comparisonPeriodAverage !== null
    ? weightAverage - comparisonPeriodAverage
    : null;
  
  // Calculate waist stats - use latest measurement from each week
  const currentWeekWaist = waistEntries.length > 0
    ? waistEntries[waistEntries.length - 1].measurement
    : null;
  const previousWeekWaist = previousWaistEntries.length > 0
    ? previousWaistEntries[previousWaistEntries.length - 1].measurement
    : null;
  const waistWeekOverWeekChange = currentWeekWaist !== null && previousWeekWaist !== null
    ? currentWeekWaist - previousWeekWaist
    : null;
  
  // Calculate comparison period waist
  const comparisonPeriodWaist = comparisonWaistEntries.length > 0
    ? comparisonWaistEntries[comparisonWaistEntries.length - 1].measurement
    : null;
  const comparisonWaistChange = currentWeekWaist !== null && comparisonPeriodWaist !== null
    ? currentWeekWaist - comparisonPeriodWaist
    : null;
  
  return {
    weekStart,
    weekEnd: toISODateString(getWeekEnd(parseISODate(weekStart))),
    weightAverage,
    weightMin,
    weightMax,
    weightCount: weekEntries.length,
    previousWeekAverage,
    weekOverWeekChange,
    comparisonPeriodAverage,
    comparisonPeriodChange,
    waistMeasurements: waistEntries,
    currentWeekWaist,
    previousWeekWaist,
    waistWeekOverWeekChange,
    comparisonPeriodWaist,
    comparisonWaistChange,
  };
};

/**
 * Get entry for a specific date
 */
export const getWeightEntryForDate = async (date: string): Promise<WeightEntry | null> => {
  const entries = await getWeightEntries();
  return entries.find((e) => e.date === date) || null;
};

export const getWaistEntryForDate = async (date: string): Promise<WaistEntry | null> => {
  const entries = await getWaistEntries();
  return entries.find((e) => e.date === date) || null;
};

// ===== Backup/Restore Operations =====

/**
 * Clear all weight and waist entries
 */
export const clearAllData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([WEIGHT_ENTRIES_KEY, WAIST_ENTRIES_KEY]);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw new Error('Failed to clear all data');
  }
};

/**
 * Import all weight and waist entries (replaces existing data)
 */
export const importAllData = async (weightEntries: WeightEntry[], waistEntries: WaistEntry[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(WEIGHT_ENTRIES_KEY, JSON.stringify(weightEntries));
    await AsyncStorage.setItem(WAIST_ENTRIES_KEY, JSON.stringify(waistEntries));
  } catch (error) {
    console.error('Error importing data:', error);
    throw new Error('Failed to import data');
  }
};

/**
 * Get all weight entries (alias for consistency)
 */
export const getAllWeightEntries = getWeightEntries;

/**
 * Get all waist entries (alias for consistency)
 */
export const getAllWaistEntries = getWaistEntries;

// ===== Auto-Backup Metadata =====

const AUTO_BACKUP_ENABLED_KEY = 'auto_backup_enabled';
const LAST_BACKUP_DATE_KEY = 'last_backup_date';

/**
 * Check if auto-backup is enabled
 */
export const isAutoBackupEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem(AUTO_BACKUP_ENABLED_KEY);
    return value === 'true'; // Default to false
  } catch (error) {
    console.error('Error checking auto-backup status:', error);
    return false;
  }
};

/**
 * Enable or disable auto-backup
 */
export const setAutoBackupEnabled = async (enabled: boolean): Promise<void> => {
  try {
    await AsyncStorage.setItem(AUTO_BACKUP_ENABLED_KEY, enabled.toString());
  } catch (error) {
    console.error('Error setting auto-backup status:', error);
    throw new Error('Failed to update auto-backup setting');
  }
};

/**
 * Get the timestamp of the last auto-backup (ISO format with time)
 */
export const getLastBackupDate = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(LAST_BACKUP_DATE_KEY);
  } catch (error) {
    console.error('Error getting last backup date:', error);
    return null;
  }
};

/**
 * Set the timestamp of the last auto-backup (ISO format with time)
 */
export const setLastBackupDate = async (date: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(LAST_BACKUP_DATE_KEY, date);
  } catch (error) {
    console.error('Error setting last backup date:', error);
    throw new Error('Failed to update last backup date');
  }
};
