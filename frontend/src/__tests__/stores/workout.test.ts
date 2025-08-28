import { renderHook, act } from '@testing-library/react-native';
import { useWorkoutStore } from '../../store/workout';
import { server } from '../msw/handlers';
import { http, HttpResponse } from 'msw';

// Mock MMKV
const mockMMKV = {
  getString: jest.fn(),
  set: jest.fn(),
  delete: jest.fn(),
};

jest.mock('react-native-mmkv', () => ({
  MMKV: jest.fn(() => mockMMKV),
}));

describe('useWorkoutStore', () => {
  beforeEach(() => {
    // Reset store state
    useWorkoutStore.setState({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: null,
      isLoading: false,
      error: null,
    });
    
    // Reset MMKV mocks
    mockMMKV.getString.mockReturnValue(null);
    mockMMKV.set.mockClear();
    mockMMKV.delete.mockClear();
  });

  describe('fetchTemplates', () => {
    it('should fetch and store workout templates', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchTemplates();
      });

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].name).toBe('Push Day');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockMMKV.set).toHaveBeenCalledWith('workout.templates', expect.any(String));
    });

    it('should handle fetch templates error', async () => {
      server.use(
        http.get('*/api/workout-templates', () => {
          return HttpResponse.json(
            { detail: 'Server error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchTemplates();
      });

      expect(result.current.templates).toHaveLength(0);
      expect(result.current.error).toBe('Server error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createTemplate', () => {
    it('should create a new workout template', async () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      const templateData = {
        name: 'Pull Day',
        description: 'Back and biceps',
        exercises: [
          { name: 'Pull-ups', sets: 3, reps: 10, weight: 0 },
        ],
      };

      await act(async () => {
        await result.current.createTemplate(templateData);
      });

      expect(result.current.templates).toHaveLength(1);
      expect(result.current.templates[0].name).toBe('Pull Day');
      expect(result.current.myTemplates).toHaveLength(1);
      expect(result.current.isLoading).toBe(false);
      expect(mockMMKV.set).toHaveBeenCalled();
    });

    it('should handle create template error', async () => {
      server.use(
        http.post('*/api/workout-templates', () => {
          return HttpResponse.json(
            { detail: 'Validation error' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useWorkoutStore());
      
      const templateData = {
        name: '',
        description: '',
        exercises: [],
      };

      await act(async () => {
        try {
          await result.current.createTemplate(templateData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Validation error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('startSession', () => {
    it('should start a new workout session', async () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      const sessionData = {
        template_id: '1',
        workout_type: 'gym' as const,
        notes: 'Test session',
      };

      await act(async () => {
        await result.current.startSession(sessionData);
      });

      expect(result.current.currentSession).toBeTruthy();
      expect(result.current.currentSession?.template_id).toBe('1');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('updateCurrentSession', () => {
    it('should update current session data', () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      // Set initial session
      act(() => {
        result.current.updateCurrentSession({
          id: '1',
          template_id: '1',
          workout_type: 'gym',
          exercises: [],
          start_time: new Date().toISOString(),
          end_time: null,
          notes: '',
          created_by: '1',
          created_at: new Date().toISOString(),
        });
      });

      // Update session
      act(() => {
        result.current.updateCurrentSession({
          notes: 'Updated notes',
          exercises: [{ name: 'Bench Press', sets: [{ reps: 10, weight: 135 }] }],
        });
      });

      expect(result.current.currentSession?.notes).toBe('Updated notes');
      expect(result.current.currentSession?.exercises).toHaveLength(1);
    });
  });

  describe('fetchWeeklyStats', () => {
    it('should fetch weekly workout statistics', async () => {
      const { result } = renderHook(() => useWorkoutStore());

      await act(async () => {
        await result.current.fetchWeeklyStats();
      });

      expect(result.current.weeklyStats).toBeTruthy();
      expect(result.current.weeklyStats?.sessions_count).toBe(3);
      expect(result.current.weeklyStats?.total_duration).toBe(180);
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useWorkoutStore());
      
      // Set error
      act(() => {
        useWorkoutStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});