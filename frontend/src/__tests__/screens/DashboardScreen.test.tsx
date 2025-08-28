import React from 'react';
import { render, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { DashboardScreen } from '../../screens/main/DashboardScreen';
import { useAuthStore } from '../../store/auth';
import { useWorkoutStore } from '../../store/workout';
import { useHabitStore } from '../../store/habit';
import { useCoupleStore } from '../../store/couple';

// Mock stores
jest.mock('../../store/auth');
jest.mock('../../store/workout');
jest.mock('../../store/habit');
jest.mock('../../store/couple');

const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;
const mockUseWorkoutStore = useWorkoutStore as jest.MockedFunction<typeof useWorkoutStore>;
const mockUseHabitStore = useHabitStore as jest.MockedFunction<typeof useHabitStore>;
const mockUseCoupleStore = useCoupleStore as jest.MockedFunction<typeof useCoupleStore>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

// Test wrapper with navigation
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('DashboardScreen', () => {
  const mockUser = {
    id: '1',
    email: 'alex@example.com',
    name: 'Alex Johnson',
  };

  const mockWeeklyStats = {
    sessions_count: 3,
    total_duration: 180,
    total_volume: 5000,
    avg_session_duration: 60,
  };

  const mockHabits = [
    {
      id: '1',
      name: 'Drink Water',
      description: 'Drink 8 glasses daily',
      cadence: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
      reminder_time: '09:00',
      created_by: '1',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockCouple = {
    id: '1',
    name: 'Alex & Sam',
    created_by: '1',
    created_at: '2024-01-01T00:00:00Z',
  };

  const mockMembers = [
    {
      id: '1',
      user_id: '1',
      couple_id: '1',
      role: 'creator' as const,
      user: mockUser,
      joined_at: '2024-01-01T00:00:00Z',
    },
    {
      id: '2',
      user_id: '2',
      couple_id: '1',
      role: 'member' as const,
      user: {
        id: '2',
        email: 'sam@example.com',
        name: 'Sam Wilson',
      },
      joined_at: '2024-01-02T00:00:00Z',
    },
  ];

  beforeEach(() => {
    mockUseAuthStore.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
      isLoading: false,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      loginWithApple: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
    });

    mockUseWorkoutStore.mockReturnValue({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: mockWeeklyStats,
      isLoading: false,
      error: null,
      fetchTemplates: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      startSession: jest.fn(),
      updateCurrentSession: jest.fn(),
      finishSession: jest.fn(),
      fetchWeeklyStats: jest.fn(),
      clearError: jest.fn(),
      clearCurrentSession: jest.fn(),
    });

    mockUseHabitStore.mockReturnValue({
      habits: mockHabits,
      logsIndexByDate: {},
      isLoading: false,
      error: null,
      fetchHabits: jest.fn(),
      createHabit: jest.fn(),
      updateHabit: jest.fn(),
      deleteHabit: jest.fn(),
      fetchLogs: jest.fn(),
      logHabit: jest.fn(),
      getLogsForDate: jest.fn(() => []),
      getHabitLogsForDateRange: jest.fn(() => []),
      clearError: jest.fn(),
    });

    mockUseCoupleStore.mockReturnValue({
      couple: mockCouple,
      members: mockMembers,
      settings: null,
      inviteCode: null,
      sharedFeed: [],
      isLoading: false,
      error: null,
      fetchCoupleInfo: jest.fn(),
      createCouple: jest.fn(),
      generateInvite: jest.fn(),
      acceptInvite: jest.fn(),
      updateSettings: jest.fn(),
      fetchSharedFeed: jest.fn(),
      leaveCouple: jest.fn(),
      clearError: jest.fn(),
      clearCoupleData: jest.fn(),
    });

    mockNavigation.navigate.mockClear();
  });

  it('should render dashboard with user greeting', () => {
    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Good morning, Alex!')).toBeTruthy();
  });

  it('should display workout statistics', () => {
    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    expect(screen.getByText('This Week')).toBeTruthy();
    expect(screen.getByText('3 Sessions')).toBeTruthy();
    expect(screen.getByText('180 min')).toBeTruthy();
    expect(screen.getByText('5000 lbs')).toBeTruthy();
  });

  it('should display habit completion rate', () => {
    const today = new Date().toISOString().split('T')[0];
    const mockGetLogsForDate = jest.fn(() => [
      {
        id: '1',
        habit_id: '1',
        date: today,
        status: 'done' as const,
        notes: '',
        created_by: '1',
        created_at: new Date().toISOString(),
      },
    ]);

    mockUseHabitStore.mockReturnValue({
      habits: mockHabits,
      logsIndexByDate: {},
      isLoading: false,
      error: null,
      fetchHabits: jest.fn(),
      createHabit: jest.fn(),
      updateHabit: jest.fn(),
      deleteHabit: jest.fn(),
      fetchLogs: jest.fn(),
      logHabit: jest.fn(),
      getLogsForDate: mockGetLogsForDate,
      getHabitLogsForDateRange: jest.fn(() => []),
      clearError: jest.fn(),
    });

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Today\'s Habits')).toBeTruthy();
    expect(screen.getByText('1/1 completed')).toBeTruthy();
  });

  it('should display partner information when in couple', () => {
    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Your Partner')).toBeTruthy();
    expect(screen.getByText('Sam Wilson')).toBeTruthy();
  });

  it('should show motivational message', () => {
    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    // Should show one of the motivational messages
    const motivationalMessages = [
      'Keep pushing forward!',
      'You\'re doing great!',
      'Stay consistent!',
      'Every step counts!',
      'Progress over perfection!',
    ];

    const hasMotivationalMessage = motivationalMessages.some(message => {
      try {
        screen.getByText(message);
        return true;
      } catch {
        return false;
      }
    });

    expect(hasMotivationalMessage).toBe(true);
  });

  it('should handle no couple state', () => {
    mockUseCoupleStore.mockReturnValue({
      couple: null,
      members: [],
      settings: null,
      inviteCode: null,
      sharedFeed: [],
      isLoading: false,
      error: null,
      fetchCoupleInfo: jest.fn(),
      createCouple: jest.fn(),
      generateInvite: jest.fn(),
      acceptInvite: jest.fn(),
      updateSettings: jest.fn(),
      fetchSharedFeed: jest.fn(),
      leaveCouple: jest.fn(),
      clearError: jest.fn(),
      clearCoupleData: jest.fn(),
    });

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Find Your Workout Partner')).toBeTruthy();
    expect(screen.getByText('Create or join a couple to start sharing your fitness journey!')).toBeTruthy();
  });

  it('should handle no workout stats', () => {
    mockUseWorkoutStore.mockReturnValue({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchTemplates: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      startSession: jest.fn(),
      updateCurrentSession: jest.fn(),
      finishSession: jest.fn(),
      fetchWeeklyStats: jest.fn(),
      clearError: jest.fn(),
      clearCurrentSession: jest.fn(),
    });

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    expect(screen.getByText('No workouts this week')).toBeTruthy();
    expect(screen.getByText('Start your first workout!')).toBeTruthy();
  });

  it('should handle no habits', () => {
    mockUseHabitStore.mockReturnValue({
      habits: [],
      logsIndexByDate: {},
      isLoading: false,
      error: null,
      fetchHabits: jest.fn(),
      createHabit: jest.fn(),
      updateHabit: jest.fn(),
      deleteHabit: jest.fn(),
      fetchLogs: jest.fn(),
      logHabit: jest.fn(),
      getLogsForDate: jest.fn(() => []),
      getHabitLogsForDateRange: jest.fn(() => []),
      clearError: jest.fn(),
    });

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    expect(screen.getByText('No habits yet')).toBeTruthy();
    expect(screen.getByText('Create your first habit!')).toBeTruthy();
  });

  it('should fetch data on mount', async () => {
    const mockFetchWeeklyStats = jest.fn();
    const mockFetchHabits = jest.fn();
    const mockFetchLogs = jest.fn();
    const mockFetchCoupleInfo = jest.fn();
    const mockFetchSharedFeed = jest.fn();

    mockUseWorkoutStore.mockReturnValue({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: mockWeeklyStats,
      isLoading: false,
      error: null,
      fetchTemplates: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      startSession: jest.fn(),
      updateCurrentSession: jest.fn(),
      finishSession: jest.fn(),
      fetchWeeklyStats: mockFetchWeeklyStats,
      clearError: jest.fn(),
      clearCurrentSession: jest.fn(),
    });

    mockUseHabitStore.mockReturnValue({
      habits: mockHabits,
      logsIndexByDate: {},
      isLoading: false,
      error: null,
      fetchHabits: mockFetchHabits,
      createHabit: jest.fn(),
      updateHabit: jest.fn(),
      deleteHabit: jest.fn(),
      fetchLogs: mockFetchLogs,
      logHabit: jest.fn(),
      getLogsForDate: jest.fn(() => []),
      getHabitLogsForDateRange: jest.fn(() => []),
      clearError: jest.fn(),
    });

    mockUseCoupleStore.mockReturnValue({
      couple: mockCouple,
      members: mockMembers,
      settings: null,
      inviteCode: null,
      sharedFeed: [],
      isLoading: false,
      error: null,
      fetchCoupleInfo: mockFetchCoupleInfo,
      createCouple: jest.fn(),
      generateInvite: jest.fn(),
      acceptInvite: jest.fn(),
      updateSettings: jest.fn(),
      fetchSharedFeed: mockFetchSharedFeed,
      leaveCouple: jest.fn(),
      clearError: jest.fn(),
      clearCoupleData: jest.fn(),
    });

    render(
      <TestWrapper>
        <DashboardScreen navigation={mockNavigation as any} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(mockFetchWeeklyStats).toHaveBeenCalled();
      expect(mockFetchHabits).toHaveBeenCalled();
      expect(mockFetchLogs).toHaveBeenCalled();
      expect(mockFetchCoupleInfo).toHaveBeenCalled();
      expect(mockFetchSharedFeed).toHaveBeenCalled();
    });
  });
});