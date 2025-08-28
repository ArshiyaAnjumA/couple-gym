import { renderHook, act } from '@testing-library/react-native';
import { useHabitStore } from '../../store/habit';
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

describe('useHabitStore', () => {
  beforeEach(() => {
    // Reset store state
    useHabitStore.setState({
      habits: [],
      logsIndexByDate: {},
      isLoading: false,
      error: null,
    });
    
    // Reset MMKV mocks
    mockMMKV.getString.mockReturnValue(null);
    mockMMKV.set.mockClear();
    mockMMKV.delete.mockClear();
  });

  describe('fetchHabits', () => {
    it('should fetch and store habits', async () => {
      const { result } = renderHook(() => useHabitStore());

      await act(async () => {
        await result.current.fetchHabits();
      });

      expect(result.current.habits).toHaveLength(1);
      expect(result.current.habits[0].name).toBe('Drink Water');
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockMMKV.set).toHaveBeenCalledWith('habit.habits', expect.any(String));
    });

    it('should handle fetch habits error', async () => {
      server.use(
        http.get('*/api/habits', () => {
          return HttpResponse.json(
            { detail: 'Server error' },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useHabitStore());

      await act(async () => {
        await result.current.fetchHabits();
      });

      expect(result.current.habits).toHaveLength(0);
      expect(result.current.error).toBe('Server error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('createHabit', () => {
    it('should create a new habit', async () => {
      const { result } = renderHook(() => useHabitStore());
      
      const habitData = {
        name: 'Exercise',
        description: 'Daily exercise routine',
        cadence: ['monday', 'wednesday', 'friday'],
        reminder_time: '07:00',
      };

      await act(async () => {
        await result.current.createHabit(habitData);
      });

      expect(result.current.habits).toHaveLength(1);
      expect(result.current.habits[0].name).toBe('Exercise');
      expect(result.current.isLoading).toBe(false);
      expect(mockMMKV.set).toHaveBeenCalled();
    });

    it('should handle create habit error', async () => {
      server.use(
        http.post('*/api/habits', () => {
          return HttpResponse.json(
            { detail: 'Validation error' },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useHabitStore());
      
      const habitData = {
        name: '',
        description: '',
        cadence: [],
        reminder_time: '',
      };

      await act(async () => {
        try {
          await result.current.createHabit(habitData);
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.error).toBe('Validation error');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logHabit', () => {
    it('should log habit completion', async () => {
      const { result } = renderHook(() => useHabitStore());
      
      const today = new Date().toISOString().split('T')[0];
      const logData = {
        date: today,
        status: 'done' as const,
        notes: 'Completed successfully',
      };

      await act(async () => {
        await result.current.logHabit('1', logData);
      });

      const logsForToday = result.current.getLogsForDate(today);
      expect(logsForToday).toHaveLength(1);
      expect(logsForToday[0].status).toBe('done');
      expect(mockMMKV.set).toHaveBeenCalledWith('habit.logs', expect.any(String));
    });

    it('should replace existing log for same habit and date', async () => {
      const { result } = renderHook(() => useHabitStore());
      
      const today = new Date().toISOString().split('T')[0];
      
      // First log
      await act(async () => {
        await result.current.logHabit('1', {
          date: today,
          status: 'done',
          notes: 'First log',
        });
      });

      // Second log for same habit and date
      await act(async () => {
        await result.current.logHabit('1', {
          date: today,
          status: 'skipped',
          notes: 'Second log',
        });
      });

      const logsForToday = result.current.getLogsForDate(today);
      expect(logsForToday).toHaveLength(1);
      expect(logsForToday[0].status).toBe('skipped');
      expect(logsForToday[0].notes).toBe('Second log');
    });
  });

  describe('getLogsForDate', () => {
    it('should return logs for specific date', () => {
      const { result } = renderHook(() => useHabitStore());
      
      const testDate = '2024-01-15';
      const mockLogs = [
        {
          id: '1',
          habit_id: '1',
          date: testDate,
          status: 'done' as const,
          notes: 'Test log',
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ];

      // Set logs directly
      act(() => {
        useHabitStore.setState({
          logsIndexByDate: {
            [testDate]: mockLogs,
          },
        });
      });

      const logs = result.current.getLogsForDate(testDate);
      expect(logs).toEqual(mockLogs);
    });

    it('should return empty array for date with no logs', () => {
      const { result } = renderHook(() => useHabitStore());
      
      const logs = result.current.getLogsForDate('2024-01-15');
      expect(logs).toEqual([]);
    });
  });

  describe('getHabitLogsForDateRange', () => {
    it('should return habit logs for date range', () => {
      const { result } = renderHook(() => useHabitStore());
      
      const mockLogs = {
        '2024-01-15': [
          {
            id: '1',
            habit_id: '1',
            date: '2024-01-15',
            status: 'done' as const,
            notes: 'Day 1',
            created_by: '1',
            created_at: new Date().toISOString(),
          },
        ],
        '2024-01-16': [
          {
            id: '2',
            habit_id: '1',
            date: '2024-01-16',
            status: 'skipped' as const,
            notes: 'Day 2',
            created_by: '1',
            created_at: new Date().toISOString(),
          },
        ],
      };

      // Set logs directly
      act(() => {
        useHabitStore.setState({
          logsIndexByDate: mockLogs,
        });
      });

      const logs = result.current.getHabitLogsForDateRange('1', '2024-01-15', '2024-01-16');
      expect(logs).toHaveLength(2);
      expect(logs[0].date).toBe('2024-01-15');
      expect(logs[1].date).toBe('2024-01-16');
    });
  });
});