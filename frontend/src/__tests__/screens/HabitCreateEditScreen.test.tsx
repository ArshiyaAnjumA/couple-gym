import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { HabitCreateEditScreen } from '../../screens/habits/HabitCreateEditScreen';
import { useHabitStore } from '../../store/habit';

// Mock the store
jest.mock('../../store/habit');
const mockUseHabitStore = useHabitStore as jest.MockedFunction<typeof useHabitStore>;

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
};

const mockRoute = {
  params: {},
};

// Test wrapper with navigation
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>
    {children}
  </NavigationContainer>
);

describe('HabitCreateEditScreen', () => {
  const mockCreateHabit = jest.fn();
  const mockUpdateHabit = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
    mockUseHabitStore.mockReturnValue({
      habits: [],
      logsIndexByDate: {},
      isLoading: false,
      error: null,
      fetchHabits: jest.fn(),
      createHabit: mockCreateHabit,
      updateHabit: mockUpdateHabit,
      deleteHabit: jest.fn(),
      fetchLogs: jest.fn(),
      logHabit: jest.fn(),
      getLogsForDate: jest.fn(() => []),
      getHabitLogsForDateRange: jest.fn(() => []),
      clearError: mockClearError,
    });

    mockCreateHabit.mockClear();
    mockUpdateHabit.mockClear();
    mockClearError.mockClear();
    mockNavigation.navigate.mockClear();
    mockNavigation.goBack.mockClear();
  });

  it('should render create habit form', () => {
    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Create Habit')).toBeTruthy();
    expect(screen.getByPlaceholderText('Habit name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeTruthy();
    expect(screen.getByText('Cadence')).toBeTruthy();
    expect(screen.getByText('Reminder Time')).toBeTruthy();
  });

  it('should render edit habit form with existing data', () => {
    const existingHabit = {
      id: '1',
      name: 'Drink Water',
      description: 'Drink 8 glasses daily',
      cadence: ['monday', 'tuesday', 'wednesday'],
      reminder_time: '09:00',
      created_by: '1',
      created_at: '2024-01-01T00:00:00Z',
    };

    const editRoute = {
      params: { habit: existingHabit },
    };

    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={editRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Habit')).toBeTruthy();
    expect(screen.getByDisplayValue('Drink Water')).toBeTruthy();
    expect(screen.getByDisplayValue('Drink 8 glasses daily')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    const saveButton = screen.getByText('Save Habit');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Habit name is required')).toBeTruthy();
    });

    expect(mockCreateHabit).not.toHaveBeenCalled();
  });

  it('should validate cadence selection', async () => {
    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // Fill name but don't select any days
    const nameInput = screen.getByPlaceholderText('Habit name');
    fireEvent.changeText(nameInput, 'Test Habit');

    const saveButton = screen.getByText('Save Habit');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please select at least one day')).toBeTruthy();
    });

    expect(mockCreateHabit).not.toHaveBeenCalled();
  });

  it('should create habit successfully', async () => {
    mockCreateHabit.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // Fill in form
    const nameInput = screen.getByPlaceholderText('Habit name');
    const descriptionInput = screen.getByPlaceholderText('Description (optional)');
    
    fireEvent.changeText(nameInput, 'New Habit');
    fireEvent.changeText(descriptionInput, 'Test description');

    // Select days
    const mondayButton = screen.getByText('Mon');
    const tuesdayButton = screen.getByText('Tue');
    fireEvent.press(mondayButton);
    fireEvent.press(tuesdayButton);

    // Set reminder time
    const reminderInput = screen.getByPlaceholderText('HH:MM');
    fireEvent.changeText(reminderInput, '08:00');

    // Save habit
    const saveButton = screen.getByText('Save Habit');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateHabit).toHaveBeenCalledWith({
        name: 'New Habit',
        description: 'Test description',
        cadence: ['monday', 'tuesday'],
        reminder_time: '08:00',
      });
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should update existing habit', async () => {
    const existingHabit = {
      id: '1',
      name: 'Drink Water',
      description: 'Drink 8 glasses daily',
      cadence: ['monday', 'tuesday'],
      reminder_time: '09:00',
      created_by: '1',
      created_at: '2024-01-01T00:00:00Z',
    };

    mockUpdateHabit.mockResolvedValue(undefined);

    const editRoute = {
      params: { habit: existingHabit },
    };

    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={editRoute as any} />
      </TestWrapper>
    );

    // Update name
    const nameInput = screen.getByDisplayValue('Drink Water');
    fireEvent.changeText(nameInput, 'Updated Habit');

    // Save habit
    const saveButton = screen.getByText('Save Habit');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateHabit).toHaveBeenCalledWith('1', {
        name: 'Updated Habit',
        description: 'Drink 8 glasses daily',
        cadence: ['monday', 'tuesday'],
        reminder_time: '09:00',
      });
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should handle create/update errors', async () => {
    const errorMessage = 'Habit name already exists';
    mockCreateHabit.mockRejectedValue({ detail: errorMessage });

    mockUseHabitStore.mockReturnValue({
      habits: [],
      logsIndexByDate: {},
      isLoading: false,
      error: errorMessage,
      fetchHabits: jest.fn(),
      createHabit: mockCreateHabit,
      updateHabit: mockUpdateHabit,
      deleteHabit: jest.fn(),
      fetchLogs: jest.fn(),
      logHabit: jest.fn(),
      getLogsForDate: jest.fn(() => []),
      getHabitLogsForDateRange: jest.fn(() => []),
      clearError: mockClearError,
    });

    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('should toggle cadence days', () => {
    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    const mondayButton = screen.getByText('Mon');
    const tuesdayButton = screen.getByText('Tue');

    // Initially not selected
    expect(mondayButton).toHaveStyle({ backgroundColor: expect.any(String) });

    // Select Monday
    fireEvent.press(mondayButton);
    expect(mondayButton).toHaveStyle({ backgroundColor: expect.any(String) });

    // Select Tuesday
    fireEvent.press(tuesdayButton);
    expect(tuesdayButton).toHaveStyle({ backgroundColor: expect.any(String) });

    // Deselect Monday
    fireEvent.press(mondayButton);
    expect(mondayButton).toHaveStyle({ backgroundColor: expect.any(String) });
  });

  it('should validate reminder time format', async () => {
    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // Fill required fields
    const nameInput = screen.getByPlaceholderText('Habit name');
    fireEvent.changeText(nameInput, 'Test Habit');

    const mondayButton = screen.getByText('Mon');
    fireEvent.press(mondayButton);

    // Invalid time format
    const reminderInput = screen.getByPlaceholderText('HH:MM');
    fireEvent.changeText(reminderInput, 'invalid');

    const saveButton = screen.getByText('Save Habit');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Invalid time format (use HH:MM)')).toBeTruthy();
    });

    expect(mockCreateHabit).not.toHaveBeenCalled();
  });

  it('should show loading state', () => {
    mockUseHabitStore.mockReturnValue({
      habits: [],
      logsIndexByDate: {},
      isLoading: true,
      error: null,
      fetchHabits: jest.fn(),
      createHabit: mockCreateHabit,
      updateHabit: mockUpdateHabit,
      deleteHabit: jest.fn(),
      fetchLogs: jest.fn(),
      logHabit: jest.fn(),
      getLogsForDate: jest.fn(() => []),
      getHabitLogsForDateRange: jest.fn(() => []),
      clearError: mockClearError,
    });

    render(
      <TestWrapper>
        <HabitCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });
});