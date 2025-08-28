import React from 'react';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { TemplateCreateEditScreen } from '../../screens/workouts/TemplateCreateEditScreen';
import { useWorkoutStore } from '../../store/workout';

// Mock the store
jest.mock('../../store/workout');
const mockUseWorkoutStore = useWorkoutStore as jest.MockedFunction<typeof useWorkoutStore>;

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

describe('TemplateCreateEditScreen', () => {
  const mockCreateTemplate = jest.fn();
  const mockUpdateTemplate = jest.fn();
  const mockClearError = jest.fn();

  beforeEach(() => {
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
      updateTemplate: mockUpdateTemplate,
      startSession: jest.fn(),
      updateCurrentSession: jest.fn(),
      finishSession: jest.fn(),
      fetchWeeklyStats: jest.fn(),
      clearError: mockClearError,
      clearCurrentSession: jest.fn(),
    });

    mockCreateTemplate.mockClear();
    mockUpdateTemplate.mockClear();
    mockClearError.mockClear();
    mockNavigation.navigate.mockClear();
    mockNavigation.goBack.mockClear();
  });

  it('should render create template form', () => {
    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Create Template')).toBeTruthy();
    expect(screen.getByPlaceholderText('Template name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Description (optional)')).toBeTruthy();
    expect(screen.getByText('Add Exercise')).toBeTruthy();
  });

  it('should render edit template form with existing data', () => {
    const existingTemplate = {
      id: '1',
      name: 'Push Day',
      description: 'Chest, shoulders, triceps',
      exercises: [
        { name: 'Bench Press', sets: 3, reps: 10, weight: 135 },
      ],
      is_system: false,
      created_by: '1',
      created_at: '2024-01-01T00:00:00Z',
    };

    const editRoute = {
      params: { template: existingTemplate },
    };

    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={editRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByText('Edit Template')).toBeTruthy();
    expect(screen.getByDisplayValue('Push Day')).toBeTruthy();
    expect(screen.getByDisplayValue('Chest, shoulders, triceps')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    const saveButton = screen.getByText('Save Template');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Template name is required')).toBeTruthy();
    });

    expect(mockCreateTemplate).not.toHaveBeenCalled();
  });

  it('should create template successfully', async () => {
    mockCreateTemplate.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // Fill in form
    const nameInput = screen.getByPlaceholderText('Template name');
    const descriptionInput = screen.getByPlaceholderText('Description (optional)');
    
    fireEvent.changeText(nameInput, 'New Template');
    fireEvent.changeText(descriptionInput, 'Test description');

    // Add an exercise
    const addExerciseButton = screen.getByText('Add Exercise');
    fireEvent.press(addExerciseButton);

    // Save template
    const saveButton = screen.getByText('Save Template');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: 'New Template',
        description: 'Test description',
        exercises: expect.any(Array),
      });
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should update existing template', async () => {
    const existingTemplate = {
      id: '1',
      name: 'Push Day',
      description: 'Chest, shoulders, triceps',
      exercises: [],
      is_system: false,
      created_by: '1',
      created_at: '2024-01-01T00:00:00Z',
    };

    mockUpdateTemplate.mockResolvedValue(undefined);

    const editRoute = {
      params: { template: existingTemplate },
    };

    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={editRoute as any} />
      </TestWrapper>
    );

    // Update name
    const nameInput = screen.getByDisplayValue('Push Day');
    fireEvent.changeText(nameInput, 'Updated Push Day');

    // Save template
    const saveButton = screen.getByText('Save Template');
    fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockUpdateTemplate).toHaveBeenCalledWith('1', {
        name: 'Updated Push Day',
        description: 'Chest, shoulders, triceps',
        exercises: expect.any(Array),
      });
    });

    expect(mockNavigation.goBack).toHaveBeenCalled();
  });

  it('should handle create/update errors', async () => {
    const errorMessage = 'Template name already exists';
    mockCreateTemplate.mockRejectedValue({ detail: errorMessage });

    mockUseWorkoutStore.mockReturnValue({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: null,
      isLoading: false,
      error: errorMessage,
      fetchTemplates: jest.fn(),
      createTemplate: mockCreateTemplate,
      updateTemplate: mockUpdateTemplate,
      startSession: jest.fn(),
      updateCurrentSession: jest.fn(),
      finishSession: jest.fn(),
      fetchWeeklyStats: jest.fn(),
      clearError: mockClearError,
      clearCurrentSession: jest.fn(),
    });

    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByText(errorMessage)).toBeTruthy();
  });

  it('should add and remove exercises', () => {
    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    // Add exercise
    const addExerciseButton = screen.getByText('Add Exercise');
    fireEvent.press(addExerciseButton);

    // Should show exercise form
    expect(screen.getByPlaceholderText('Exercise name')).toBeTruthy();
    expect(screen.getByPlaceholderText('Sets')).toBeTruthy();
    expect(screen.getByPlaceholderText('Reps')).toBeTruthy();

    // Fill exercise details
    const exerciseNameInput = screen.getByPlaceholderText('Exercise name');
    fireEvent.changeText(exerciseNameInput, 'Bench Press');

    // Remove exercise
    const removeButton = screen.getByText('Remove');
    fireEvent.press(removeButton);

    // Exercise form should be gone
    expect(screen.queryByPlaceholderText('Exercise name')).toBeNull();
  });

  it('should show loading state', () => {
    mockUseWorkoutStore.mockReturnValue({
      templates: [],
      myTemplates: [],
      systemTemplates: [],
      currentSession: null,
      weeklyStats: null,
      isLoading: true,
      error: null,
      fetchTemplates: jest.fn(),
      createTemplate: mockCreateTemplate,
      updateTemplate: mockUpdateTemplate,
      startSession: jest.fn(),
      updateCurrentSession: jest.fn(),
      finishSession: jest.fn(),
      fetchWeeklyStats: jest.fn(),
      clearError: mockClearError,
      clearCurrentSession: jest.fn(),
    });

    render(
      <TestWrapper>
        <TemplateCreateEditScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </TestWrapper>
    );

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
  });
});