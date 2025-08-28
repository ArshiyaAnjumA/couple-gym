import { act, renderHook } from '@testing-library/react-native';
import { useWorkoutStore } from '../../store/workout';
import { server } from '../../../jest.setup';
import { http, HttpResponse } from 'msw';

// Reset store before each test
beforeEach(() => {
  const { getState } = useWorkoutStore;
  act(() => {
    getState().templates = [];
    getState().myTemplates = [];
    getState().systemTemplates = [];
    getState().currentSession = null;
    getState().weeklyStats = null;
    getState().error = null;
    getState().isLoading = false;
  });
});

describe('useWorkoutStore', () => {
  describe('fetchTemplates', () => {
    it('should fetch templates successfully', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchTemplates();
      });

      expect(result.current.templates.length).toBeGreaterThan(0);
      expect(result.current.templates[0]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        mode: expect.any(String),
        exercises: expect.any(Array),
        is_system: expect.any(Boolean),
        created_by: expect.any(String),
        created_at: expect.any(String),
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch failure', async () => {
      // Mock failed fetch
      server.use(
        http.get('/api/workout-templates', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchTemplates();
      });

      expect(result.current.templates).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch templates');
    });
  });

  describe('createTemplate', () => {
    it('should create template successfully', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      const newTemplate = {
        name: 'New Workout',
        description: 'A great workout routine',
        mode: 'gym' as const,
        exercises: [
          { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
          { name: 'Squats', sets: 3, reps: 12, weight: 185 }
        ],
      };

      await act(async () => {
        await result.current.createTemplate(newTemplate);
      });

      expect(result.current.templates.length).toBe(1);
      expect(result.current.templates[0].name).toBe(newTemplate.name);
      expect(result.current.templates[0].mode).toBe(newTemplate.mode);
      expect(result.current.error).toBeNull();
    });

    it('should handle create failure', async () => {
      // Mock failed create
      server.use(
        http.post('/api/workout-templates', () => {
          return new HttpResponse(null, { status: 400 });
        })
      );

      const { result } = renderHook(() => useWorkoutStore());

      const newTemplate = {
        name: '',
        description: 'Invalid template',
        mode: 'gym' as const,
        exercises: [],
      };

      await act(async () => {
        try {
          await result.current.createTemplate(newTemplate);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.templates).toEqual([]);
      expect(result.current.error).toBe('Failed to create template');
    });
  });

  describe('updateTemplate', () => {
    it('should update template successfully', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      // First create a template
      const newTemplate = {
        name: 'Original Name',
        description: 'Original description',
        mode: 'gym' as const,
        exercises: [{ name: 'Push-up', sets: 3, reps: 10 }],
      };

      await act(async () => {
        await result.current.createTemplate(newTemplate);
      });

      const templateId = result.current.templates[0].id;
      const updatedData = {
        name: 'Updated Name',
        description: 'Updated description',
        mode: 'home' as const,
        exercises: [
          { name: 'Push-up', sets: 4, reps: 12 },
          { name: 'Squats', sets: 3, reps: 15 }
        ],
      };

      await act(async () => {
        await result.current.updateTemplate(templateId, updatedData);
      });

      const updatedTemplate = result.current.templates[0];
      expect(updatedTemplate.name).toBe('Updated Name');
      expect(updatedTemplate.mode).toBe('home');
      expect(updatedTemplate.exercises.length).toBe(2);
    });
  });

  describe('workout sessions', () => {
    it('should start session successfully', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      const sessionData = {
        name: 'Test Session',
        mode: 'gym' as const,
        exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 135 }],
        start_time: new Date().toISOString(),
        template_id: 'template-1',
      };

      await act(async () => {
        await result.current.startSession(sessionData);
      });

      expect(result.current.currentSession).toBeTruthy();
      expect(result.current.currentSession?.name).toBe(sessionData.name);
      expect(result.current.error).toBeNull();
    });

    it('should update current session', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      // First start a session
      const sessionData = {
        name: 'Test Session',
        mode: 'gym' as const,
        exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 135 }],
        start_time: new Date().toISOString(),
        template_id: 'template-1',
      };

      await act(async () => {
        await result.current.startSession(sessionData);
      });

      expect(result.current.currentSession).toBeTruthy();

      // Update session with exercise data
      const updatedSession = {
        notes: 'Great workout session!',
        end_time: new Date().toISOString(),
      };

      act(() => {
        result.current.updateCurrentSession(updatedSession);
      });

      expect(result.current.currentSession?.notes).toBe('Great workout session!');
      expect(result.current.currentSession?.end_time).toBeTruthy();
    });

    it('should finish session successfully', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      // First start a session
      const sessionData = {
        name: 'Test Session',
        mode: 'gym' as const,
        exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 135 }],
        start_time: new Date().toISOString(),
        template_id: 'template-1',
      };

      await act(async () => {
        await result.current.startSession(sessionData);
      });

      expect(result.current.currentSession).toBeTruthy();

      await act(async () => {
        await result.current.finishSession();
      });

      expect(result.current.currentSession).toBeNull();
    });
  });

  describe('fetchWeeklyStats', () => {
    it('should fetch weekly stats successfully', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchWeeklyStats();
      });

      expect(result.current.weeklyStats).toBeTruthy();
      expect(result.current.weeklyStats).toEqual({
        totalWorkouts: expect.any(Number),
        totalVolume: expect.any(Number),
        totalDuration: expect.any(Number),
        averageDuration: expect.any(Number),
      });
    });
  });

  describe('error handling', () => {
    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useWorkoutStore());

      // Manually set error for testing
      act(() => {
        result.current.error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('loading states', () => {
    it('should set loading state during operations', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      // Start fetch
      act(() => {
        result.current.fetchTemplates();
      });

      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });
});