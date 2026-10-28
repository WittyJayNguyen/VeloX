export interface User {
  id: string;
  user_code?: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  credit_balance?: number;
  tier?: string;
  is_active: boolean;
  roles: string[];
  permissions?: string[];
  created_at: string;
  last_login_at?: string;
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
  website_hp?: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface ChangePasswordPayload {
  old_password: string;
  new_password: string;
}
