// API DTOs and Types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  date_of_birth?: string;
  gender?: string;
  height?: number;
  weight?: number;
  activity_level?: string;
  goals?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiError {
  detail: string;
  status_code: number;
}

export interface HealthResponse {
  status: string;
  app: string;
  version: string;
  database: string;
}

// Auth related types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Apple Sign In Response
export interface AppleSignInResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}