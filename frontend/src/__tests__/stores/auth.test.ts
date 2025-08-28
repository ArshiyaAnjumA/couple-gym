import { renderHook, act } from '@testing-library/react-native';
import { useAuthStore } from '../../store/auth';
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

// Mock API service
const mockApiService = {
  login: jest.fn(),
  register: jest.fn(),
  signInWithApple: jest.fn(),
  logout: jest.fn(),
  getMe: jest.fn(),
  setTokens: jest.fn(),
  clearTokens: jest.fn(),
  getAccessToken: jest.fn(),
};

jest.mock('../../services/api', () => ({
  apiService: mockApiService,
}));

describe('useAuthStore', () => {
  beforeEach(() => {
    // Reset store state
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Reset mocks
    mockMMKV.getString.mockReturnValue(null);
    mockMMKV.set.mockClear();
    mockMMKV.delete.mockClear();
    Object.values(mockApiService).forEach(mock => mock.mockClear());
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const mockResponse = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: '1',
          email: 'alex@example.com',
          name: 'Alex Johnson',
        },
      };

      mockApiService.login.mockResolvedValue(mockResponse);
      mockApiService.setTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login({
          email: 'alex@example.com',
          password: 'password123',
        });
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockMMKV.set).toHaveBeenCalledWith('auth.user', JSON.stringify(mockResponse.user));
    });

    it('should handle login error', async () => {
      const mockError = { detail: 'Invalid credentials' };
      mockApiService.login.mockRejectedValue(mockError);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        try {
          await result.current.login({
            email: 'wrong@example.com',
            password: 'wrongpassword',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should register successfully', async () => {
      const mockResponse = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: '3',
          email: 'newuser@example.com',
          name: 'New User',
        },
      };

      mockApiService.register.mockResolvedValue(mockResponse);
      mockApiService.setTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
      expect(mockMMKV.set).toHaveBeenCalledWith('auth.user', JSON.stringify(mockResponse.user));
    });
  });

  describe('loginWithApple', () => {
    it('should login with Apple successfully', async () => {
      const mockResponse = {
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        user: {
          id: '4',
          email: 'apple@example.com',
          name: 'Apple User',
        },
      };

      mockApiService.signInWithApple.mockResolvedValue(mockResponse);
      mockApiService.setTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.loginWithApple('identity-token', 'auth-code');
      });

      expect(result.current.user).toEqual(mockResponse.user);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          isAuthenticated: true,
        });
      });

      mockApiService.logout.mockResolvedValue(undefined);
      mockApiService.clearTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockMMKV.delete).toHaveBeenCalledWith('auth.user');
    });

    it('should logout locally even if API call fails', async () => {
      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: { id: '1', email: 'test@example.com', name: 'Test User' },
          isAuthenticated: true,
        });
      });

      mockApiService.logout.mockRejectedValue(new Error('Network error'));
      mockApiService.clearTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('checkAuthStatus', () => {
    it('should validate existing token and set user', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
      };

      mockApiService.getAccessToken.mockResolvedValue('valid-token');
      mockApiService.getMe.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuthStatus();
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    it('should clear auth state if no token exists', async () => {
      mockApiService.getAccessToken.mockResolvedValue(null);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuthStatus();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('should clear auth state if token is invalid', async () => {
      mockApiService.getAccessToken.mockResolvedValue('invalid-token');
      mockApiService.getMe.mockRejectedValue(new Error('Unauthorized'));
      mockApiService.clearTokens.mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuthStatus();
      });

      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockApiService.clearTokens).toHaveBeenCalled();
      expect(mockMMKV.delete).toHaveBeenCalledWith('auth.user');
    });
  });

  describe('setUser', () => {
    it('should update user in store and persist to MMKV', () => {
      const { result } = renderHook(() => useAuthStore());
      
      const newUser = {
        id: '1',
        email: 'updated@example.com',
        name: 'Updated User',
      };

      act(() => {
        result.current.setUser(newUser);
      });

      expect(result.current.user).toEqual(newUser);
      expect(mockMMKV.set).toHaveBeenCalledWith('auth.user', JSON.stringify(newUser));
    });
  });

  describe('clearError', () => {
    it('should clear error state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      // Set error
      act(() => {
        useAuthStore.setState({ error: 'Test error' });
      });

      expect(result.current.error).toBe('Test error');

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });
});