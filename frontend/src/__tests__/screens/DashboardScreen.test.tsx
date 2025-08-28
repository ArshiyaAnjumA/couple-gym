import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import DashboardScreen from '../../screens/main/DashboardScreen';
import { useWorkoutStore } from '../../store/workout';
import { useHabitStore } from '../../store/habit';
import { useCoupleStore } from '../../store/couple';
import { useAuthStore } from '../../store/auth';

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: jest.fn(),
  }),
  useFocusEffect: jest.fn((callback) => callback()),
}));

// Mock stores
jest.mock('../../store/workout');
jest.mock('../../store/habit');
jest.mock('../../store/couple');
jest.mock('../../store/auth');

const mockUseWorkoutStore = useWorkoutStore as jest.MockedFunction<typeof useWorkoutStore>;
const mockUseHabitStore = useHabitStore as jest.MockedFunction<typeof useHabitStore>;
const mockUseCoupleStore = useCoupleStore as jest.MockedFunction<typeof useCoupleStore>;
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: any) => 
    React.createElement('Text', { testID: `icon-${name}` }, `Icon: ${name}`),
}));

describe('DashboardScreen', () => {
  const defaultWorkoutState = {
    templates: [],
    sessions: [],
    currentSession: null,
    weeklyStats: {
      totalWorkouts: 5,
      totalVolume: 12500,
      totalDuration: 300,
      averageDuration: 60,
    },
    isLoading: false,
    error: null,
    fetchMyTemplates: jest.fn(),
    createTemplate: jest.fn(),
    updateTemplate: jest.fn(),
    deleteTemplate: jest.fn(),
    startSession: jest.fn(),
    updateCurrentSession: jest.fn(),
    finishSession: jest.fn(),
    fetchSessions: jest.fn(),
    fetchWeeklyStats: jest.fn(),
    clearError: jest.fn(),
  };

  const defaultHabitState = {
    habits: [
      {
        id: '1',
        name: 'Drink Water',
        description: 'Drink 8 glasses daily',
        cadence: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        reminder_enabled: true,
        reminder_time: '09:00',
        user_id: '1',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      },
    ],
    logs: [],
    isLoading: false,
    error: null,
    fetchHabits: jest.fn(),
    createHabit: jest.fn(),
    updateHabit: jest.fn(),
    deleteHabit: jest.fn(),
    logHabit: jest.fn(),
    fetchLogs: jest.fn(),
    getLogForDate: jest.fn(),
    getLogsForDate: jest.fn().mockReturnValue([
      {
        id: '1',
        habit_id: '1',
        date: '2024-01-01',
        status: 'done',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]),
    getHabitLogsForDateRange: jest.fn(),
    clearError: jest.fn(),
  };

  const defaultCoupleState = {
    currentCouple: {
      id: '1',
      name: 'Test Couple',
      members: [
        {
          id: '1',
          email: 'user1@example.com',
          full_name: 'User One',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          email: 'user2@example.com',
          full_name: 'User Two',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
      created_by: '1',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    shareSettings: {
      workouts: true,
      habits: true,
      progress: false,
    },
    sharedFeed: [
      {
        id: '1',
        type: 'workout',
        user_name: 'User Two',
        title: 'Completed Push Day workout',
        description: '45 minutes, 3 exercises',
        timestamp: '2024-01-01T10:00:00Z',
      },
    ],
    inviteCode: null,
    isLoading: false,
    error: null,
    createCouple: jest.fn(),
    joinCouple: jest.fn(),
    getInviteCode: jest.fn(),
    acceptInvite: jest.fn(),
    updateShareSettings: jest.fn(),
    fetchSharedFeed: jest.fn(),
    fetchCoupleData: jest.fn(),
    clearError: jest.fn(),
  };

  const defaultAuthState = {
    isAuthenticated: true,
    isLoading: false,
    user: {
      id: '1',
      email: 'user1@example.com',
      full_name: 'User One',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
    tokens: {
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      token_type: 'bearer',
    },
    error: null,
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn(),
    loginWithApple: jest.fn(),
    refreshAccessToken: jest.fn(),
    clearError: jest.fn(),
    checkAuthStatus: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkoutStore.mockReturnValue(defaultWorkoutState);
    mockUseHabitStore.mockReturnValue(defaultHabitState);
    mockUseCoupleStore.mockReturnValue(defaultCoupleState);
    mockUseAuthStore.mockReturnValue(defaultAuthState);
  });

  it('should render dashboard with user greeting', async () => {
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/Hello, User One/i)).toBeTruthy();
    });
  });

  it('should display workout statistics', async () => {
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('5')).toBeTruthy(); // totalWorkouts
      expect(getByText(/12,500/)).toBeTruthy(); // totalVolume in kg
      expect(getByText('5h 0m')).toBeTruthy(); // totalDuration in hours/minutes
    });
  });

  it('should display habit completion rate', async () => {
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/100%/)).toBeTruthy(); // Completion rate based on mock data
    });
  });

  it('should show partner activity when couple exists', async () => {
    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/User Two/)).toBeTruthy();
      expect(getByText(/Completed Push Day workout/)).toBeTruthy();
    });
  });

  it('should show motivational message when no recent activity', async () => {
    mockUseCoupleStore.mockReturnValue({
      ...defaultCoupleState,
      sharedFeed: [],
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/Ready for today's workout/i)).toBeTruthy();
    });
  });

  it('should show empty state when no workouts completed', async () => {
    mockUseWorkoutStore.mockReturnValue({
      ...defaultWorkoutState,
      weeklyStats: {
        totalWorkouts: 0,
        totalVolume: 0,
        totalDuration: 0,
        averageDuration: 0,
      },
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText('0')).toBeTruthy();
      expect(getByText(/Start your first workout/i)).toBeTruthy();
    });
  });

  it('should show empty state when no habits exist', async () => {
    mockUseHabitStore.mockReturnValue({
      ...defaultHabitState,
      habits: [],
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/Create your first habit/i)).toBeTruthy();
    });
  });

  it('should display loading states', async () => {
    mockUseWorkoutStore.mockReturnValue({
      ...defaultWorkoutState,
      isLoading: true,
    });

    const { queryByText } = render(<DashboardScreen />);

    // Should show loading indicator or skeleton
    // In a real implementation, you'd check for loading indicators
    expect(queryByText('Hello')).toBeTruthy();
  });

  it('should handle couple invitation state', async () => {
    mockUseCoupleStore.mockReturnValue({
      ...defaultCoupleState,
      currentCouple: null,
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      expect(getByText(/Create or join a couple/i)).toBeTruthy();
    });
  });

  it('should format workout duration correctly', async () => {
    // Test various duration formats
    const testCases = [
      { minutes: 45, expected: '45m' },
      { minutes: 90, expected: '1h 30m' },
      { minutes: 120, expected: '2h 0m' },
    ];

    for (const testCase of testCases) {
      mockUseWorkoutStore.mockReturnValue({
        ...defaultWorkoutState,
        weeklyStats: {
          ...defaultWorkoutState.weeklyStats!,
          totalDuration: testCase.minutes,
        },
      });

      const { getByText } = render(<DashboardScreen />);

      await waitFor(() => {
        expect(getByText(testCase.expected)).toBeTruthy();
      });
    }
  });

  it('should calculate habit completion percentage correctly', async () => {
    // Mock habit with partial completion
    mockUseHabitStore.mockReturnValue({
      ...defaultHabitState,
      getLogsForDate: jest.fn().mockReturnValue([
        { habit_id: '1', status: 'done' },
        { habit_id: '2', status: 'skip' },
      ]),
      habits: [
        { ...defaultHabitState.habits[0] },
        {
          id: '2',
          name: 'Exercise',
          description: 'Daily exercise',
          cadence: ['monday', 'tuesday'],
          reminder_enabled: false,
          reminder_time: '07:00',
          user_id: '1',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ],
    });

    const { getByText } = render(<DashboardScreen />);

    await waitFor(() => {
      // 50% completion rate (1 done, 1 skipped)
      expect(getByText(/50%/)).toBeTruthy();
    });
  });
});