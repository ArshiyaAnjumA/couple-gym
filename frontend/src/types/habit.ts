export interface Habit {
  id: string;
  name: string;
  description?: string;
  cadence: 'daily' | 'weekly' | 'custom';
  cadence_config?: {
    days_of_week?: number[]; // 0=Sunday, 1=Monday, etc.
    custom_days?: number;
  };
  reminder_enabled: boolean;
  reminder_time_local?: string; // HH:MM format
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface HabitLog {
  id: string;
  habit_id: string;
  date: string; // YYYY-MM-DD format
  status: 'done' | 'skipped';
  notes?: string;
  created_at: string;
}

export interface CreateHabitRequest {
  name: string;
  description?: string;
  cadence: 'daily' | 'weekly' | 'custom';
  cadence_config?: {
    days_of_week?: number[];
    custom_days?: number;
  };
  reminder_enabled: boolean;
  reminder_time_local?: string;
}

export interface CreateHabitLogRequest {
  date: string;
  status: 'done' | 'skipped';
  notes?: string;
}