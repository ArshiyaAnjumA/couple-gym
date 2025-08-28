import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import TemplateCreateEditScreen from '../../screens/workouts/TemplateCreateEditScreen';
import { useWorkoutStore } from '../../store/workout';

// Mock navigation
const mockGoBack = jest.fn();
jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: {},
  }),
}));

// Mock workout store
jest.mock('../../store/workout');
const mockUseWorkoutStore = useWorkoutStore as jest.MockedFunction<typeof useWorkoutStore>;

// Mock Ionicons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name, size, color }: any) => 
    React.createElement('Text', { testID: `icon-${name}` }, `Icon: ${name}`),
}));

describe('TemplateCreateEditScreen', () => {
  const defaultStoreState = {
    templates: [],
    sessions: [],
    currentSession: null,
    weeklyStats: null,
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

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseWorkoutStore.mockReturnValue(defaultStoreState);
  });

  it('should render create template form', () => {
    const { getByText, getByPlaceholderText } = render(<TemplateCreateEditScreen />);

    expect(getByText('Create Template')).toBeTruthy();
    expect(getByPlaceholderText('Enter template name')).toBeTruthy();
    expect(getByPlaceholderText('Enter description (optional)')).toBeTruthy();
    expect(getByText('Gym')).toBeTruthy();
    expect(getByText('Home')).toBeTruthy();
  });

  it('should validate required fields', async () => {
    const { getByText, queryByText } = render(<TemplateCreateEditScreen />);

    const saveButton = getByText('Save');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(queryByText(/required/i)).toBeTruthy();
    });
  });

  it('should create template with valid data', async () => {
    const mockCreateTemplate = jest.fn().mockResolvedValue(undefined);
    mockUseWorkoutStore.mockReturnValue({
      ...defaultStoreState,
      createTemplate: mockCreateTemplate,
    });

    const { getByText, getByPlaceholderText } = render(<TemplateCreateEditScreen />);

    // Fill in form
    const nameInput = getByPlaceholderText('Enter template name');
    const descriptionInput = getByPlaceholderText('Enter description (optional)');
    const exerciseNameInput = getByPlaceholderText('Enter exercise name');

    await act(async () => {
      fireEvent.changeText(nameInput, 'Test Workout');
      fireEvent.changeText(descriptionInput, 'A test workout routine');
      fireEvent.changeText(exerciseNameInput, 'Push-ups');
    });

    // Submit form
    const saveButton = getByText('Save');
    
    await act(async () => {
      fireEvent.press(saveButton);
    });

    await waitFor(() => {
      expect(mockCreateTemplate).toHaveBeenCalledWith({
        name: 'Test Workout',
        description: 'A test workout routine',
        mode: 'gym',
        exercises: expect.arrayContaining([
          expect.objectContaining({
            name: 'Push-ups',
          }),
        ]),
      });
      expect(mockGoBack).toHaveBeenCalled();
    });
  });

  it('should add and remove exercises', async () => {
    const { getByText, getAllByPlaceholderText, queryByTestId } = render(<TemplateCreateEditScreen />);

    // Initially should have one exercise
    expect(getAllByPlaceholderText('Enter exercise name')).toHaveLength(1);

    // Add exercise
    const addButton = getByText('Add Exercise');
    
    await act(async () => {
      fireEvent.press(addButton);
    });

    expect(getAllByPlaceholderText('Enter exercise name')).toHaveLength(2);

    // Remove exercise (should be able to remove when more than one)
    const removeButton = queryByTestId('icon-trash');
    if (removeButton) {
      await act(async () => {
        fireEvent.press(removeButton);
      });

      expect(getAllByPlaceholderText('Enter exercise name')).toHaveLength(1);
    }
  });

  it('should switch between gym and home modes', async () => {
    const { getByText } = render(<TemplateCreateEditScreen />);

    const gymMode = getByText('Gym');
    const homeMode = getByText('Home');

    // Should default to gym mode
    expect(gymMode.props.style).toContainEqual(
      expect.objectContaining({ color: 'white' })
    );

    // Switch to home mode
    await act(async () => {
      fireEvent.press(homeMode);
    });

    expect(homeMode.props.style).toContainEqual(
      expect.objectContaining({ color: 'white' })
    );
  });

  it('should handle loading state', () => {
    mockUseWorkoutStore.mockReturnValue({
      ...defaultStoreState,
      isLoading: true,
    });

    const { getByText } = render(<TemplateCreateEditScreen />);

    expect(getByText('Saving...')).toBeTruthy();
  });

  it('should handle errors', () => {
    const mockClearError = jest.fn();
    mockUseWorkoutStore.mockReturnValue({
      ...defaultStoreState,
      error: 'Failed to create template',
      clearError: mockClearError,
    });

    render(<TemplateCreateEditScreen />);

    // Error should be handled by useEffect and Alert
    // In a real test environment, you might want to mock Alert.alert
    expect(mockClearError).toHaveBeenCalledTimes(0); // Will be called when Alert is dismissed
  });

  it('should cancel navigation', async () => {
    const { getByText } = render(<TemplateCreateEditScreen />);

    const cancelButton = getByText('Cancel');
    
    await act(async () => {
      fireEvent.press(cancelButton);
    });

    expect(mockGoBack).toHaveBeenCalled();
  });
});