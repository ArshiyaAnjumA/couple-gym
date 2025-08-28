import React from 'react';
import { render } from '@testing-library/react-native';
import AppNavigator from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/auth';

// Mock navigation components
jest.mock('../../navigation/AuthNavigator', () => {
  return function MockAuthNavigator() {
    return <MockedComponent testID="auth-navigator">Auth Navigator</MockedComponent>;
  };
});

jest.mock('../../navigation/MainTabNavigator', () => {
  return function MockMainTabNavigator() {
    return <MockedComponent testID="main-tab-navigator">Main Tab Navigator</MockedComponent>;
  };
});

// Mock component for React Native
function MockedComponent({ children, testID }: { children: string; testID: string }) {
  return React.createElement('View', { testID }, children);
}

// Mock auth store
jest.mock('../../store/auth');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render AuthNavigator when not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      tokens: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loginWithApple: jest.fn(),
      refreshAccessToken: jest.fn(),
      clearError: jest.fn(),
      checkAuthStatus: jest.fn(),
    });

    const { getByTestId, queryByTestId } = render(<AppNavigator />);

    expect(getByTestId('auth-navigator')).toBeTruthy();
    expect(queryByTestId('main-tab-navigator')).toBeNull();
  });

  it('should render MainTabNavigator when authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: {
        id: '1',
        email: 'test@example.com',
        full_name: 'Test User',
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
    });

    const { getByTestId, queryByTestId } = render(<AppNavigator />);

    expect(getByTestId('main-tab-navigator')).toBeTruthy();
    expect(queryByTestId('auth-navigator')).toBeNull();
  });

  it('should not render anything when loading', () => {
    mockUseAuthStore.mockReturnValue({
      isAuthenticated: false,
      isLoading: true,
      user: null,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      logout: jest.fn(),
      loginWithApple: jest.fn(),
      clearError: jest.fn(),
      checkAuthStatus: jest.fn(),
      setUser: jest.fn(),
    });

    const { queryByTestId } = render(<AppNavigator />);

    // Should render nothing (null) when loading
    expect(queryByTestId('auth-navigator')).toBeNull();
    expect(queryByTestId('main-tab-navigator')).toBeNull();
  });
});