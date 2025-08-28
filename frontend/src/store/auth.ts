import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { MMKV } from 'react-native-mmkv';
import { apiService } from '../services/api';
import { User, LoginRequest, RegisterRequest } from '../types/api';

// MMKV storage instance
const storage = new MMKV();

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthActions {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (userData: RegisterRequest) => Promise<void>;
  loginWithApple: (identityToken: string, authorizationCode: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuthStatus: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
}

type AuthStore = AuthState & AuthActions;

// Persist middleware for MMKV
const persist = <T extends object>(
  config: (set: any, get: any) => T,
  options: { name: string }
): ((set: any, get: any) => T) => (set, get) => {
  const store = config(set, get);
  
  // Load initial state from MMKV
  try {
    const storedUser = storage.getString(`${options.name}.user`);
    if (storedUser) {
      const user = JSON.parse(storedUser);
      (store as any).user = user;
      (store as any).isAuthenticated = true;
    }
  } catch (error) {
    console.error('Error loading persisted auth state:', error);
  }

  return store;
};

export const useAuthStore = create<AuthStore>()(
  immer((set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials: LoginRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await apiService.login(credentials);
          await apiService.setTokens(response.access_token, response.refresh_token);
          
          // Persist user to MMKV
          storage.set('auth.user', JSON.stringify(response.user));
          
          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Login failed';
            state.isLoading = false;
          });
          throw error;
        }
      },

      register: async (userData: RegisterRequest) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await apiService.register(userData);
          await apiService.setTokens(response.access_token, response.refresh_token);
          
          // Persist user to MMKV
          storage.set('auth.user', JSON.stringify(response.user));
          
          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Registration failed';
            state.isLoading = false;
          });
          throw error;
        }
      },

      loginWithApple: async (identityToken: string, authorizationCode: string) => {
        set((state) => {
          state.isLoading = true;
          state.error = null;
        });

        try {
          const response = await apiService.signInWithApple(identityToken, authorizationCode);
          await apiService.setTokens(response.access_token, response.refresh_token);
          
          // Persist user to MMKV
          storage.set('auth.user', JSON.stringify(response.user));
          
          set((state) => {
            state.user = response.user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error: any) {
          set((state) => {
            state.error = error.detail || 'Apple Sign In failed';
            state.isLoading = false;
          });
          throw error;
        }
      },

      logout: async () => {
        set((state) => {
          state.isLoading = true;
        });

        try {
          await apiService.logout();
        } catch (error) {
          console.error('Logout API call failed:', error);
          // Continue with local logout even if API fails
        }

        // Clear persisted data
        storage.delete('auth.user');
        await apiService.clearTokens();
        
        set((state) => {
          state.user = null;
          state.isAuthenticated = false;
          state.isLoading = false;
          state.error = null;
        });
      },

      checkAuthStatus: async () => {
        const accessToken = await apiService.getAccessToken();
        if (!accessToken) {
          set((state) => {
            state.isAuthenticated = false;
            state.user = null;
          });
          return;
        }

        set((state) => {
          state.isLoading = true;
        });

        try {
          const user = await apiService.getMe();
          storage.set('auth.user', JSON.stringify(user));
          
          set((state) => {
            state.user = user;
            state.isAuthenticated = true;
            state.isLoading = false;
          });
        } catch (error) {
          console.error('Auth check failed:', error);
          // Clear invalid tokens
          await apiService.clearTokens();
          storage.delete('auth.user');
          
          set((state) => {
            state.user = null;
            state.isAuthenticated = false;
            state.isLoading = false;
          });
        }
      },

      clearError: () => {
        set((state) => {
          state.error = null;
        });
      },

      setUser: (user: User) => {
        storage.set('auth.user', JSON.stringify(user));
        set((state) => {
          state.user = user;
        });
      },
    })),
    { name: 'auth' }
  )
);