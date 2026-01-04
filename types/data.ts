export interface WeightEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  weight: number; // in kg
  notes?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export interface WaistEntry {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  measurement: number; // in cm
  notes?: string;
  createdAt: number; // timestamp
  updatedAt: number; // timestamp
}

export type ComparisonPeriod = '1w' | '2w' | '4w';

export interface WeeklyStats {
  weekStart: string; // ISO date string for Monday
  weekEnd: string; // ISO date string for Sunday
  weightAverage: number | null;
  weightMin: number | null;
  weightMax: number | null;
  weightCount: number;
  previousWeekAverage: number | null;
  weekOverWeekChange: number | null; // difference from previous week
  comparisonPeriodAverage: number | null; // average over comparison period (1w, 2w, or 4w ago)
  comparisonPeriodChange: number | null; // change vs comparison period
  waistMeasurements: WaistEntry[];
  currentWeekWaist: number | null; // latest waist measurement this week
  previousWeekWaist: number | null; // latest waist measurement previous week
  waistWeekOverWeekChange: number | null; // difference in waist from previous week
  comparisonPeriodWaist: number | null; // waist measurement from comparison period ago
  comparisonWaistChange: number | null; // change in waist vs comparison period
}

export interface WeekData {
  weekStart: string;
  weekEnd: string;
  weightEntries: WeightEntry[];
  waistEntries: WaistEntry[];
}
