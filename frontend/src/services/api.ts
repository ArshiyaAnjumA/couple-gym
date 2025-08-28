import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { LoginRequest, LoginResponse, RegisterRequest, RefreshTokenRequest, User, ApiError, HealthResponse } from '../types/api';

const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8001';

// Token storage keys
const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}/api`;
  }

  // Token management
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting access token:', error);
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error getting refresh token:', error);
      return null;
    }
  }

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
    } catch (error) {
      console.error('Error storing tokens:', error);
      throw error;
    }
  }

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
    } catch (error) {
      console.error('Error clearing tokens:', error);
    }
  }

  // HTTP client with token refresh - UPDATED to be public
  async request<T>(
    url: string,
    options: RequestInit = {},
    skipAuth = false
  ): Promise<T> {
    const accessToken = await this.getAccessToken();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...((options.headers as Record<string, string>) || {}),
    };

    if (!skipAuth && accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      ...options,
      headers,
    });

    // Handle 401 - attempt token refresh
    if (response.status === 401 && !skipAuth && !url.includes('/auth/')) {
      const refreshed = await this.refreshAccessToken();
      if (refreshed) {
        // Retry the original request with new token
        const newAccessToken = await this.getAccessToken();
        headers.Authorization = `Bearer ${newAccessToken}`;
        const retryResponse = await fetch(`${this.baseUrl}${url}`, {
          ...options,
          headers,
        });
        return this.handleResponse<T>(retryResponse);
      } else {
        // Refresh failed, clear tokens and throw error
        await this.clearTokens();
        throw new Error('Authentication failed');
      }
    }

    return this.handleResponse<T>(response);
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorMessage;
      } catch {
        // Ignore JSON parse errors for error responses
      }
      
      const error: ApiError = {
        detail: errorMessage,
        status_code: response.status,
      };
      throw error;
    }

    return response.json();
  }

  private async refreshAccessToken(): Promise<boolean> {
    try {
      const refreshToken = await this.getRefreshToken();
      if (!refreshToken) {
        return false;
      }

      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      await this.setTokens(data.access_token, data.refresh_token);
      return true;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  // API endpoints
  async login(credentials: LoginRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }, true);
  }

  async register(userData: RegisterRequest): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    }, true);
  }

  async logout(): Promise<void> {
    await this.request('/auth/logout', { method: 'POST' });
    await this.clearTokens();
  }

  async getMe(): Promise<User> {
    return this.request<User>('/me');
  }

  async checkHealth(): Promise<HealthResponse> {
    return this.request<HealthResponse>('/health', {}, true);
  }

  // Apple Sign In - placeholder for now
  async signInWithApple(identityToken: string, authorizationCode: string): Promise<LoginResponse> {
    return this.request<LoginResponse>('/auth/apple', {
      method: 'POST',
      body: JSON.stringify({
        identity_token: identityToken,
        authorization_code: authorizationCode,
      }),
    }, true);
  }
}

export const apiService = new ApiService();