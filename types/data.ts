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

export interface WeeklyStats {
  weekStart: string; // ISO date string for Monday
  weekEnd: string; // ISO date string for Sunday
  weightAverage: number | null;
  weightMin: number | null;
  weightMax: number | null;
  weightCount: number;
  previousWeekAverage: number | null;
  weekOverWeekChange: number | null; // difference from previous week
  waistMeasurements: WaistEntry[];
}

export interface WeekData {
  weekStart: string;
  weekEnd: string;
  weightEntries: WeightEntry[];
  waistEntries: WaistEntry[];
}
