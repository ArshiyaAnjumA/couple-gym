import { act, renderHook } from '@testing-library/react-native';
import { useHabitStore } from '../../store/habit';
import { server } from '../../../jest.setup';
import { http, HttpResponse } from 'msw';

// Reset store before each test
beforeEach(() => {
  const { getState } = useHabitStore;
  act(() => {
    getState().habits = [];
    getState().logsIndexByDate = {};
    getState().error = null;
    getState().isLoading = false;
  });
});

describe('useHabitStore', () => {
  describe('fetchHabits', () => {
    it('should fetch habits successfully', async () => {
      const { result } = renderHook(() => useHabitStore());

      await act(async () => {
        await result.current.fetchHabits();
      });

      expect(result.current.habits.length).toBeGreaterThan(0);
      expect(result.current.habits[0]).toEqual({
        id: expect.any(String),
        name: expect.any(String),
        description: expect.any(String),
        cadence: expect.any(String),
        reminder_enabled: expect.any(Boolean),
        reminder_time_local: expect.any(String),
        is_active: expect.any(Boolean),
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle fetch failure', async () => {
      // Mock failed fetch
      server.use(
        http.get('/api/habits', () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      const { result } = renderHook(() => useHabitStore());

      await act(async () => {
        await result.current.fetchHabits();
      });

      expect(result.current.habits).toEqual([]);
      expect(result.current.error).toBe('Failed to fetch habits');
    });
  });

  describe('createHabit', () => {
    it('should create habit successfully', async () => {
      const { result } = renderHook(() => useHabitStore());

      const newHabit = {
        name: 'Morning Exercise',
        description: 'Do 30 minutes of exercise every morning',
        cadence: 'daily' as const,
        reminder_enabled: true,
        reminder_time_local: '07:30',
      };

      await act(async () => {
        await result.current.createHabit(newHabit);
      });

      expect(result.current.habits.length).toBe(1);
      expect(result.current.habits[0].name).toBe(newHabit.name);
      expect(result.current.error).toBeNull();
    });

    it('should handle create failure', async () => {
      // Mock failed create
      server.use(
        http.post('/api/habits', () => {
          return new HttpResponse(null, { status: 400 });
        })
      );

      const { result } = renderHook(() => useHabitStore());

      const newHabit = {
        name: '',
        description: 'Invalid habit',
        cadence: 'daily' as const,
        reminder_enabled: false,
        reminder_time_local: '08:00',
      };

      await act(async () => {
        try {
          await result.current.createHabit(newHabit);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.habits).toEqual([]);
      expect(result.current.error).toBe('Failed to create habit');
    });
  });

  describe('updateHabit', () => {
    it('should update habit successfully', async () => {
      const { result } = renderHook(() => useHabitStore());

      // First create a habit
      const newHabit = {
        name: 'Original Name',
        description: 'Original description',
        cadence: 'daily' as const,
        reminder_enabled: false,
        reminder_time_local: '09:00',
      };

      await act(async () => {
        await result.current.createHabit(newHabit);
      });

      const habitId = result.current.habits[0].id;
      const updatedData = {
        name: 'Updated Name',
        description: 'Updated description',
        cadence: 'weekly' as const,
        reminder_enabled: true,
        reminder_time_local: '10:00',
      };

      await act(async () => {
        await result.current.updateHabit(habitId, updatedData);
      });

      const updatedHabit = result.current.habits[0];
      expect(updatedHabit.name).toBe('Updated Name');
      expect(updatedHabit.cadence).toBe('weekly');
      expect(updatedHabit.reminder_enabled).toBe(true);
    });
  });

  describe('deleteHabit', () => {
    it('should delete habit successfully', async () => {
      const { result } = renderHook(() => useHabitStore());

      // First create a habit
      const newHabit = {
        name: 'To Delete',
        description: 'This will be deleted',
        cadence: 'daily' as const,
        reminder_enabled: false,
        reminder_time_local: '09:00',
      };

      await act(async () => {
        await result.current.createHabit(newHabit);
      });

      expect(result.current.habits.length).toBe(1);
      const habitId = result.current.habits[0].id;

      await act(async () => {
        await result.current.deleteHabit(habitId);
      });

      expect(result.current.habits.length).toBe(0);
    });
  });

  describe('logHabit', () => {
    it('should log habit as done', async () => {
      const { result } = renderHook(() => useHabitStore());

      const habitId = 'test-habit-id';
      const logData = {
        date: '2024-01-01',
        status: 'done' as const,
      };

      await act(async () => {
        await result.current.logHabit(habitId, logData);
      });

      const logs = result.current.getLogsForDate('2024-01-01');
      expect(logs.find(l => l.habit_id === habitId)?.status).toBe('done');
    });

    it('should log habit as skipped', async () => {
      const { result } = renderHook(() => useHabitStore());

      const habitId = 'test-habit-id';
      const logData = {
        date: '2024-01-01',
        status: 'skipped' as const,
      };

      await act(async () => {
        await result.current.logHabit(habitId, logData);
      });

      const logs = result.current.getLogsForDate('2024-01-01');
      expect(logs.find(l => l.habit_id === habitId)?.status).toBe('skipped');
    });
  });

  describe('getLogsForDate', () => {
    it('should return logs for specific date', async () => {
      const { result } = renderHook(() => useHabitStore());

      const date = '2024-01-01';
      const habitId1 = 'habit-1';
      const habitId2 = 'habit-2';

      await act(async () => {
        await result.current.logHabit(habitId1, { date, status: 'done' });
        await result.current.logHabit(habitId2, { date, status: 'skipped' });
      });

      const logs = result.current.getLogsForDate(date);
      expect(logs.length).toBe(2);
      expect(logs.find(l => l.habit_id === habitId1)?.status).toBe('done');
      expect(logs.find(l => l.habit_id === habitId2)?.status).toBe('skipped');
    });
  });

  describe('getHabitLogsForDateRange', () => {
    it('should return logs for date range', async () => {
      const { result } = renderHook(() => useHabitStore());

      const habitId = 'test-habit';
      
      await act(async () => {
        await result.current.logHabit(habitId, { date: '2024-01-01', status: 'done' });
        await result.current.logHabit(habitId, { date: '2024-01-02', status: 'skipped' });
        await result.current.logHabit(habitId, { date: '2024-01-03', status: 'done' });
      });

      const logs = result.current.getHabitLogsForDateRange(habitId, '2024-01-01', '2024-01-03');
      expect(logs.length).toBe(3);
    });
  });

  describe('error handling', () => {
    it('should clear error when clearError is called', () => {
      const { result } = renderHook(() => useHabitStore());

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
      const { result } = renderHook(() => useHabitStore());

      // Start fetch
      act(() => {
        result.current.fetchHabits();
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