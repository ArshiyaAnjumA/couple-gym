import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';
import { apiService } from '../services/api';
import { Habit, HabitLog, CreateHabitRequest, CreateHabitLogRequest } from '../types/habit';

const storage = new MMKV();

interface HabitState {
  habits: Habit[];
  logsIndexByDate: Record<string, HabitLog[]>; // date -> logs
  isLoading: boolean;
  error: string | null;
}

interface HabitActions {
  fetchHabits: () => Promise<void>;
  createHabit: (habit: CreateHabitRequest) => Promise<void>;
  updateHabit: (id: string, habit: Partial<CreateHabitRequest>) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  fetchLogs: (from?: string, to?: string) => Promise<void>;
  logHabit: (habitId: string, log: CreateHabitLogRequest) => Promise<void>;
  getLogsForDate: (date: string) => HabitLog[];
  getHabitLogsForDateRange: (habitId: string, from: string, to: string) => HabitLog[];
  clearError: () => void;
}

type HabitStore = HabitState & HabitActions;

export const useHabitStore = create<HabitStore>()(
  immer((set, get) => {
    // Load initial state from MMKV
    let initialHabits: Habit[] = [];
    let initialLogs: Record<string, HabitLog[]> = {};
    
    try {
      const storedHabits = storage.getString('habit.habits');
      if (storedHabits) {
        initialHabits = JSON.parse(storedHabits);
      }
      
      const storedLogs = storage.getString('habit.logs');
      if (storedLogs) {
        initialLogs = JSON.parse(storedLogs);
      }
    } catch (error) {
      console.error('Error loading persisted habits:', error);
    }

    return {
      // Initial state
      habits: initialHabits,
      logsIndexByDate: initialLogs,
      isLoading: false,
      error: null,

      // Actions
      fetchHabits: async () => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const habits = await apiService.request<Habit[]>('/habits');
          
          // Persist to MMKV
          storage.set('habit.habits', JSON.stringify(habits));
          
          set((state) => {
            state.habits = habits;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to fetch habits';
            state.isLoading = false;
          });
        }
      },

      createHabit: async (habitData: CreateHabitRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const newHabit = await apiService.request<Habit>('/habits', {
            method: 'POST',
            body: JSON.stringify(habitData),
          });

          set((state) => {
            state.habits.unshift(newHabit);
            state.isLoading = false;
          });

          // Update persisted habits
          const { habits } = get();
          storage.set('habit.habits', JSON.stringify(habits));
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to create habit';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateHabit: async (id: string, habitData: Partial<CreateHabitRequest>) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const updatedHabit = await apiService.request<Habit>(`/habits/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(habitData),
          });

          set((state) => {
            const index = state.habits.findIndex(h => h.id === id);
            if (index !== -1) {
              state.habits[index] = updatedHabit;
            }
            state.isLoading = false;
          });

          // Update persisted habits
          const { habits } = get();
          storage.set('habit.habits', JSON.stringify(habits));
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to update habit';
            state.isLoading = false;
          });
          throw error;
        }
      },

      deleteHabit: async (id: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          await apiService.request(`/habits/${id}`, {
            method: 'DELETE',
          });

          set((state) => {
            state.habits = state.habits.filter(h => h.id !== id);
            state.isLoading = false;
          });

          // Update persisted habits
          const { habits } = get();
          storage.set('habit.habits', JSON.stringify(habits));
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to delete habit';
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchLogs: async (from?: string, to?: string) => {
        try {
          const params = new URLSearchParams();
          if (from) params.append('from', from);
          if (to) params.append('to', to);
          
          const url = `/habits/logs${params.toString() ? `?${params.toString()}` : ''}`;
          const logs = await apiService.request<HabitLog[]>(url);
          
          // Index logs by date
          const logsByDate: Record<string, HabitLog[]> = {};
          logs.forEach(log => {
            const date = log.date;
            if (!logsByDate[date]) {
              logsByDate[date] = [];
            }
            logsByDate[date].push(log);
          });

          set((state) => {
            // Merge with existing logs
            Object.keys(logsByDate).forEach(date => {
              state.logsIndexByDate[date] = logsByDate[date];
            });
          });

          // Persist logs
          const { logsIndexByDate } = get();
          storage.set('habit.logs', JSON.stringify(logsIndexByDate));
        } catch (error: any) {
          console.error('Failed to fetch habit logs:', error);
          // Don't set error state for logs fetch - it's not critical
        }
      },

      logHabit: async (habitId: string, logData: CreateHabitLogRequest) => {
        try {
          const newLog = await apiService.request<HabitLog>(`/habits/${habitId}/logs`, {
            method: 'POST',
            body: JSON.stringify(logData),
          });

          set((state) => {
            const date = newLog.date;
            if (!state.logsIndexByDate[date]) {
              state.logsIndexByDate[date] = [];
            }
            
            // Remove any existing log for this habit on this date
            state.logsIndexByDate[date] = state.logsIndexByDate[date].filter(
              log => log.habit_id !== habitId
            );
            
            // Add the new log
            state.logsIndexByDate[date].push(newLog);
          });

          // Persist logs
          const { logsIndexByDate } = get();
          storage.set('habit.logs', JSON.stringify(logsIndexByDate));
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to log habit';
          });
          throw error;
        }
      },

      getLogsForDate: (date: string) => {
        const { logsIndexByDate } = get();
        return logsIndexByDate[date] || [];
      },

      getHabitLogsForDateRange: (habitId: string, from: string, to: string) => {
        const { logsIndexByDate } = get();
        const logs: HabitLog[] = [];
        
        const startDate = new Date(from);
        const endDate = new Date(to);
        
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0];
          const dateLogs = logsIndexByDate[dateStr] || [];
          const habitLog = dateLogs.find(log => log.habit_id === habitId);
          if (habitLog) {
            logs.push(habitLog);
          }
        }
        
        return logs;
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },
    };
  })
);