import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TemplatesListScreen } from '../../screens/workouts/TemplatesListScreen';
import { TemplateCreateEditScreen } from '../../screens/workouts/TemplateCreateEditScreen';
import { SessionStartScreen } from '../../screens/workouts/SessionStartScreen';
import { SessionTrackScreen } from '../../screens/workouts/SessionTrackScreen';
import { SessionSummaryScreen } from '../../screens/workouts/SessionSummaryScreen';
import { useWorkoutStore } from '../../store/workout';

// Mock the store
jest.mock('../../store/workout');
const mockUseWorkoutStore = useWorkoutStore as jest.MockedFunction<typeof useWorkoutStore>;

const Stack = createNativeStackNavigator();

const WorkoutNavigator = () => (
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="TemplatesList" component={TemplatesListScreen} />
      <Stack.Screen name="TemplateCreateEdit" component={TemplateCreateEditScreen} />
      <Stack.Screen name="SessionStart" component={SessionStartScreen} />
      <Stack.Screen name="SessionTrack" component={SessionTrackScreen} />
      <Stack.Screen name="SessionSummary" component={SessionSummaryScreen} />
    </Stack.Navigator>
  </NavigationContainer>
);

describe('Workout Flow Integration', () => {
  const mockTemplates = [
    {
      id: '1',
      name: 'Push Day',
      description: 'Chest, shoulders, triceps',
      exercises: [
        { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
        { name: 'Shoulder Press', sets: 3, reps: 12, weight: 65 },
      ],
      is_system: false,
      created_by: '1',
      created_at: '2024-01-01T00:00:00Z',
    },
  ];

  const mockSession = {
    id: '1',
    template_id: '1',
    workout_type: 'gym' as const,
    start_time: new Date().toISOString(),
    end_time: null,
    exercises: [],
    notes: '',
    created_by: '1',
    created_at: new Date().toISOString(),
  };

  beforeEach(() => {
    mockUseWorkoutStore.mockReturnValue({
      templates: mockTemplates,
      myTemplates: mockTemplates,
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
  });

  it('should complete full workout flow: create template → start session → track → finish', async () => {
    const mockCreateTemplate = jest.fn().mockResolvedValue(undefined);
    const mockStartSession = jest.fn().mockResolvedValue(undefined);
    const mockFinishSession = jest.fn().mockResolvedValue(undefined);

    mockUseWorkoutStore.mockReturnValue({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchTemplates: jest.fn(),
      createTemplate: mockCreateTemplate,
      updateTemplate: jest.fn(),
      startSession: mockStartSession,
      updateCurrentSession: jest.fn(),
      finishSession: mockFinishSession,
      fetchWeeklyStats: jest.fn(),
      clearError: jest.fn(),
      clearCurrentSession: jest.fn(),
    });

    render(<WorkoutNavigator />);

    // Step 1: Create a new template
    const createButton = screen.getByText('Create Template');
    fireEvent.press(createButton);

    // Fill template form
    const nameInput = screen.getByPlaceholderText('Template name');
    fireEvent.changeText(nameInput, 'Test Workout');

    const addExerciseButton = screen.getByText('Add Exercise');
    fireEvent.press(addExerciseButton);

    const exerciseNameInput = screen.getByPlaceholderText('Exercise name');
    fireEvent.changeText(exerciseNameInput, 'Bench Press');

    const saveButton = screen.getByText('Save Template');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: 'Test Workout',
        description: '',
        exercises: expect.arrayContaining([
          expect.objectContaining({ name: 'Bench Press' })
        ]),
      });
    });

    // Step 2: Start a session with the template
    // Mock updated store state with the new template
    mockUseWorkoutStore.mockReturnValue({
      templates: [
        {
          id: '2',
          name: 'Test Workout',
          description: '',
          exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 135 }],
          is_system: false,
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ],
      myTemplates: [
        {
          id: '2',
          name: 'Test Workout',
          description: '',
          exercises: [{ name: 'Bench Press', sets: 3, reps: 10, weight: 135 }],
          is_system: false,
          created_by: '1',
          created_at: new Date().toISOString(),
        },
      ],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchTemplates: jest.fn(),
      createTemplate: mockCreateTemplate,
      updateTemplate: jest.fn(),
      startSession: mockStartSession,
      updateCurrentSession: jest.fn(),
      finishSession: mockFinishSession,
      fetchWeeklyStats: jest.fn(),
      clearError: jest.fn(),
      clearCurrentSession: jest.fn(),
    });

    const startWorkoutButton = screen.getByText('Start Workout');
    fireEvent.press(startWorkoutButton);

    const gymModeButton = screen.getByText('Gym Mode');
    fireEvent.press(gymModeButton);

    const beginSessionButton = screen.getByText('Begin Session');
    fireEvent.press(beginSessionButton);

    await waitFor(() => {
      expect(mockStartSession).toHaveBeenCalledWith({
        template_id: '2',
        workout_type: 'gym',
        notes: '',
      });
    });

    // Step 3: Track the session
    // Mock session in progress
    mockUseWorkoutStore.mockReturnValue({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: {
        ...mockSession,
        template_id: '2',
        exercises: [
          {
            name: 'Bench Press',
            sets: [
              { reps: 10, weight: 135 },
              { reps: 10, weight: 135 },
              { reps: 8, weight: 145 },
            ],
          },
        ],
      },
      weeklyStats: null,
      isLoading: false,
      error: null,
      fetchTemplates: jest.fn(),
      createTemplate: mockCreateTemplate,
      updateTemplate: jest.fn(),
      startSession: mockStartSession,
      updateCurrentSession: jest.fn(),
      finishSession: mockFinishSession,
      fetchWeeklyStats: jest.fn(),
      clearError: jest.fn(),
      clearCurrentSession: jest.fn(),
    });

    // Add sets to exercises
    const addSetButton = screen.getByText('Add Set');
    fireEvent.press(addSetButton);

    const repsInput = screen.getByPlaceholderText('Reps');
    const weightInput = screen.getByPlaceholderText('Weight');
    
    fireEvent.changeText(repsInput, '10');
    fireEvent.changeText(weightInput, '135');

    // Step 4: Finish the session
    const finishButton = screen.getByText('Finish Workout');
    fireEvent.press(finishButton);

    await waitFor(() => {
      expect(mockFinishSession).toHaveBeenCalled();
    });

    // Should navigate to summary screen
    expect(screen.getByText('Workout Complete!')).toBeTruthy();
    expect(screen.getByText('Great job on your workout!')).toBeTruthy();
  });

  it('should handle session interruption and recovery', async () => {
    // Mock session in progress
    mockUseWorkoutStore.mockReturnValue({
      templates: mockTemplates,
      myTemplates: mockTemplates,
      systemTemplates: [],
      currentSession: mockSession,
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

    render(<WorkoutNavigator />);

    // Should show resume session option
    expect(screen.getByText('Resume Current Session')).toBeTruthy();
    expect(screen.getByText('You have a workout in progress')).toBeTruthy();

    const resumeButton = screen.getByText('Resume');
    fireEvent.press(resumeButton);

    // Should navigate to session tracking
    expect(screen.getByText('Current Workout')).toBeTruthy();
  });

  it('should validate template creation with exercises', async () => {
    render(<WorkoutNavigator />);

    const createButton = screen.getByText('Create Template');
    fireEvent.press(createButton);

    // Try to save without exercises
    const nameInput = screen.getByPlaceholderText('Template name');
    fireEvent.changeText(nameInput, 'Empty Template');

    const saveButton = screen.getByText('Save Template');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Please add at least one exercise')).toBeTruthy();
    });
  });

  it('should handle network errors during session operations', async () => {
    const mockStartSession = jest.fn().mockRejectedValue({ detail: 'Network error' });

    mockUseWorkoutStore.mockReturnValue({
      templates: mockTemplates,
      myTemplates: mockTemplates,
      systemTemplates: [],
      currentSession: null,
      weeklyStats: null,
      isLoading: false,
      error: 'Network error',
      fetchTemplates: jest.fn(),
      createTemplate: jest.fn(),
      updateTemplate: jest.fn(),
      startSession: mockStartSession,
      updateCurrentSession: jest.fn(),
      finishSession: jest.fn(),
      fetchWeeklyStats: jest.fn(),
      clearError: jest.fn(),
      clearCurrentSession: jest.fn(),
    });

    render(<WorkoutNavigator />);

    const startWorkoutButton = screen.getByText('Start Workout');
    fireEvent.press(startWorkoutButton);

    const gymModeButton = screen.getByText('Gym Mode');
    fireEvent.press(gymModeButton);

    const beginSessionButton = screen.getByText('Begin Session');
    fireEvent.press(beginSessionButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeTruthy();
    });
  });
});