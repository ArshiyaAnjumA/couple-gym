import { act, renderHook } from '@testing-library/react-native';
import { useAuthStore } from '../../store/auth';
import { server } from '../../../jest.setup';
import { http, HttpResponse } from 'msw';

// Reset store before each test
beforeEach(() => {
  const { getState } = useAuthStore;
  act(() => {
    getState().logout();
  });
});

describe('useAuthStore', () => {
  describe('login', () => {
    it('should handle successful login', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('alex@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: '1',
        email: 'alex@example.com',
        full_name: 'Alex Johnson',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result.current.tokens).toEqual({
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        token_type: 'bearer',
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle login failure', async () => {
      // Mock failed login
      server.use(
        http.post('/api/auth/login', () => {
          return new HttpResponse(null, { status: 401 });
        })
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('invalid@example.com', 'wrongpassword');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
      expect(result.current.error).toBe('Invalid credentials');
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login('alex@example.com', 'password123');
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      // Wait for completion
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('register', () => {
    it('should handle successful registration', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123', 'New User');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: expect.any(String),
        email: 'newuser@example.com',
        full_name: 'New User',
        created_at: expect.any(String),
        updated_at: expect.any(String),
      });
      expect(result.current.error).toBeNull();
    });

    it('should handle registration failure', async () => {
      // Mock failed registration
      server.use(
        http.post('/api/auth/register', () => {
          return new HttpResponse(null, { status: 400 });
        })
      );

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('existing@example.com', 'password123', 'Existing User');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe('Registration failed');
    });
  });

  describe('logout', () => {
    it('should clear user data on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      await act(async () => {
        await result.current.login('alex@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      act(() => {
        result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.tokens).toBeNull();
    });
  });

  describe('Apple Sign In', () => {
    it('should handle Apple sign in when available', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Mock successful Apple sign in
      server.use(
        http.post('/api/auth/apple', () => {
          return HttpResponse.json({
            access_token: 'mock-apple-access-token',
            refresh_token: 'mock-apple-refresh-token',
            token_type: 'bearer',
            user: {
              id: '3',
              email: 'apple@example.com',
              full_name: 'Apple User',
              created_at: '2024-01-01T00:00:00Z',
              updated_at: '2024-01-01T00:00:00Z',
            },
          });
        })
      );

      await act(async () => {
        await result.current.loginWithApple();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('apple@example.com');
    });
  });

  describe('token refresh', () => {
    it('should refresh tokens when needed', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login to get tokens
      await act(async () => {
        await result.current.login('alex@example.com', 'password123');
      });

      // Mock refresh endpoint
      server.use(
        http.post('/api/auth/refresh', () => {
          return HttpResponse.json({
            access_token: 'new-access-token',
            token_type: 'bearer',
          });
        })
      );

      await act(async () => {
        await result.current.refreshAccessToken();
      });

      expect(result.current.tokens?.access_token).toBe('new-access-token');
    });
  });

  describe('error handling', () => {
    it('should clear error when clearError is called', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Trigger an error
      await act(async () => {
        await result.current.login('invalid@example.com', 'wrongpassword');
      });

      expect(result.current.error).toBeTruthy();

      // Clear error
      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('checkAuthStatus', () => {
    it('should check authentication status on init', async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.checkAuthStatus();
      });

      // Should complete without error even if no stored tokens
      expect(result.current.isLoading).toBe(false);
    });
  });
});