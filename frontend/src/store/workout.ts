import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';
import { apiService } from '../services/api';
import { WorkoutTemplate, WorkoutSession, WorkoutStats, CreateWorkoutTemplateRequest, CreateWorkoutSessionRequest } from '../types/workout';

const storage = new MMKV();

interface WorkoutState {
  templates: WorkoutTemplate[];
  myTemplates: WorkoutTemplate[];
  systemTemplates: WorkoutTemplate[];
  currentSession: WorkoutSession | null;
  weeklyStats: WorkoutStats['weekly'] | null;
  isLoading: boolean;
  error: string | null;
}

interface WorkoutActions {
  fetchTemplates: (mine?: boolean) => Promise<void>;
  createTemplate: (template: CreateWorkoutTemplateRequest) => Promise<void>;
  updateTemplate: (id: string, template: Partial<CreateWorkoutTemplateRequest>) => Promise<void>;
  startSession: (session: CreateWorkoutSessionRequest) => Promise<void>;
  updateCurrentSession: (session: Partial<WorkoutSession>) => void;
  finishSession: () => Promise<void>;
  fetchWeeklyStats: () => Promise<void>;
  clearError: () => void;
  clearCurrentSession: () => void;
}

type WorkoutStore = WorkoutState & WorkoutActions;

export const useWorkoutStore = create<WorkoutStore>()(
  immer((set, get) => {
    // Load initial state from MMKV
    let initialTemplates: WorkoutTemplate[] = [];
    try {
      const stored = storage.getString('workout.templates');
      if (stored) {
        initialTemplates = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Error loading persisted workout templates:', error);
    }

    return {
      // Initial state
      templates: initialTemplates,
      myTemplates: initialTemplates.filter(t => !t.is_system),
      systemTemplates: initialTemplates.filter(t => t.is_system),
      currentSession: null,
      weeklyStats: null,
      isLoading: false,
      error: null,

      // Actions
      fetchTemplates: async (mine = false) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const url = `/workout-templates${mine !== undefined ? `?mine=${mine}` : ''}`;
          const templates = await apiService.request<WorkoutTemplate[]>(url);
          
          // Persist to MMKV
          storage.set('workout.templates', JSON.stringify(templates));
          
          set((state) => {
            state.templates = templates;
            state.myTemplates = templates.filter(t => !t.is_system);
            state.systemTemplates = templates.filter(t => t.is_system);
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to fetch templates';
            state.isLoading = false;
          });
        }
      },

      createTemplate: async (templateData: CreateWorkoutTemplateRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const newTemplate = await apiService.request<WorkoutTemplate>('/workout-templates', {
            method: 'POST',
            body: JSON.stringify(templateData),
          });

          set((state) => {
            state.templates.unshift(newTemplate);
            if (!newTemplate.is_system) {
              state.myTemplates.unshift(newTemplate);
            }
            state.isLoading = false;
          });

          // Update persisted templates
          const { templates } = get();
          storage.set('workout.templates', JSON.stringify(templates));
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to create template';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateTemplate: async (id: string, templateData: Partial<CreateWorkoutTemplateRequest>) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const updatedTemplate = await apiService.request<WorkoutTemplate>(`/workout-templates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(templateData),
          });

          set((state) => {
            const index = state.templates.findIndex(t => t.id === id);
            if (index !== -1) {
              state.templates[index] = updatedTemplate;
            }

            const myIndex = state.myTemplates.findIndex(t => t.id === id);
            if (myIndex !== -1) {
              state.myTemplates[myIndex] = updatedTemplate;
            }
            state.isLoading = false;
          });

          // Update persisted templates
          const { templates } = get();
          storage.set('workout.templates', JSON.stringify(templates));
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to update template';
            state.isLoading = false;
          });
          throw error;
        }
      },

      startSession: async (sessionData: CreateWorkoutSessionRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const newSession = await apiService.request<WorkoutSession>('/workout-sessions', {
            method: 'POST',
            body: JSON.stringify(sessionData),
          });

          set((state) => {
            state.currentSession = newSession;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to start session';
            state.isLoading = false;
          });
          throw error;
        }
      },

      updateCurrentSession: (sessionData: Partial<WorkoutSession>) => {
        set((state) => {
          if (state.currentSession) {
            Object.assign(state.currentSession, sessionData);
          }
        });
      },

      finishSession: async () => {
        const { currentSession } = get();
        if (!currentSession) return;

        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const finishedSession = await apiService.request<WorkoutSession>(`/workout-sessions/${currentSession.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              end_time: new Date().toISOString(),
              exercises: currentSession.exercises,
              notes: currentSession.notes,
            }),
          });

          set((state) => {
            state.currentSession = null;
            state.isLoading = false;
          });

          // Refresh weekly stats after finishing session
          get().fetchWeeklyStats();
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Failed to finish session';
            state.isLoading = false;
          });
          throw error;
        }
      },

      fetchWeeklyStats: async () => {
        try {
          const stats = await apiService.request<WorkoutStats>('/workout-stats/weekly');
          
          set((state) => {
            state.weeklyStats = stats.weekly;
          });
        } catch (error: any) {
          console.error('Failed to fetch weekly stats:', error);
          // Don't set error state for stats - it's not critical
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      clearCurrentSession: () => {
        set((state) => {
          state.currentSession = null;
        });
      },
    };
  })
);