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
        await result.current.login({ email: 'alex@example.com', password: 'password123' });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        id: '1',
        email: 'alex@example.com',
        full_name: 'Alex Johnson',
        created_at: expect.any(String),
        updated_at: expect.any(String),
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
        try {
          await result.current.login({ email: 'invalid@example.com', password: 'wrongpassword' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeTruthy();
      expect(result.current.isLoading).toBe(false);
    });

    it('should set loading state during login', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Start login
      act(() => {
        result.current.login({ email: 'alex@example.com', password: 'password123' });
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
        await result.current.register({ 
          email: 'newuser@example.com', 
          password: 'password123', 
          full_name: 'New User' 
        });
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
        try {
          await result.current.register({ 
            email: 'existing@example.com', 
            password: 'password123', 
            full_name: 'Existing User' 
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('logout', () => {
    it('should clear user data on logout', async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      await act(async () => {
        await result.current.login({ email: 'alex@example.com', password: 'password123' });
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
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
        await result.current.loginWithApple('identity-token', 'auth-code');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('apple@example.com');
    });
  });

  describe('error handling', () => {
    it('should clear error when clearError is called', async () => {
      const { result } = renderHook(() => useAuthStore());

      // Trigger an error
      await act(async () => {
        try {
          await result.current.login({ email: 'invalid@example.com', password: 'wrongpassword' });
        } catch (error) {
          // Expected to throw
        }
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