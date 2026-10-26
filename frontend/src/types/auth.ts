// ============================================
// Global Auth Types
// ============================================
export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  is_active: boolean;
  roles: string[];
  created_at: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

// ============================================
// API Response Envelope
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  size: number;
  total: number;
  pages: number;
}
