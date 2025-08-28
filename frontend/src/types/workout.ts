export interface Exercise {
  name: string;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number; // in seconds
}

export interface WorkoutTemplate {
  id: string;
  name: string;
  description?: string;
  mode: 'gym' | 'home';
  exercises: Exercise[];
  is_system: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface WorkoutSession {
  id: string;
  template_id?: string;
  name: string;
  mode: 'gym' | 'home';
  exercises: Exercise[];
  start_time: string;
  end_time?: string;
  duration?: number; // in seconds
  total_volume?: number;
  notes?: string;
  created_at: string;
}

export interface WorkoutStats {
  weekly: {
    sessions_count: number;
    total_duration: number; // in seconds
    total_volume: number;
    week_start: string;
  };
}

export interface CreateWorkoutTemplateRequest {
  name: string;
  description?: string;
  mode: 'gym' | 'home';
  exercises: Exercise[];
}

export interface CreateWorkoutSessionRequest {
  template_id?: string;
  name: string;
  mode: 'gym' | 'home';
  exercises: Exercise[];
  start_time: string;
  end_time?: string;
  notes?: string;
}