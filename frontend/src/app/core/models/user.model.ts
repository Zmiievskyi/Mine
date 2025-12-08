export interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'admin';
  createdAt?: Date;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string; // Optional until backend implements refresh tokens
}
