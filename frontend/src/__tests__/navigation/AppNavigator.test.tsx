import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { AppNavigator } from '../../navigation/AppNavigator';
import { useAuthStore } from '../../store/auth';

// Mock the auth store
jest.mock('../../store/auth');
const mockUseAuthStore = useAuthStore as jest.MockedFunction<typeof useAuthStore>;

// Mock navigation components
jest.mock('../../navigation/AuthNavigator', () => ({
  AuthNavigator: () => <div testID="auth-navigator">Auth Navigator</div>,
}));

jest.mock('../../navigation/MainTabNavigator', () => ({
  MainTabNavigator: () => <div testID="main-tab-navigator">Main Tab Navigator</div>,
}));

describe('AppNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render AuthNavigator when user is not authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
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

    render(<AppNavigator />);

    expect(screen.getByTestId('auth-navigator')).toBeTruthy();
    expect(screen.queryByTestId('main-tab-navigator')).toBeNull();
  });

  it('should render MainTabNavigator when user is authenticated', () => {
    mockUseAuthStore.mockReturnValue({
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      },
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

    render(<AppNavigator />);

    expect(screen.getByTestId('main-tab-navigator')).toBeTruthy();
    expect(screen.queryByTestId('auth-navigator')).toBeNull();
  });

  it('should show loading state when authentication is loading', () => {
    mockUseAuthStore.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      error: null,
      login: jest.fn(),
      register: jest.fn(),
      loginWithApple: jest.fn(),
      logout: jest.fn(),
      checkAuthStatus: jest.fn(),
      clearError: jest.fn(),
      setUser: jest.fn(),
    });

    render(<AppNavigator />);

    expect(screen.getByTestId('loading-indicator')).toBeTruthy();
    expect(screen.queryByTestId('auth-navigator')).toBeNull();
    expect(screen.queryByTestId('main-tab-navigator')).toBeNull();
  });
});