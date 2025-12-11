export type UserRole = 'user' | 'admin';

export interface User {
  id: string;
  email: string | null; // Nullable for Telegram users
  name: string | null;
  role: UserRole;
  emailVerified?: boolean;
  avatarUrl?: string;
  provider?: 'local' | 'google' | 'github' | 'telegram';
  telegramUsername?: string;
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
}

export interface TelegramAuthData {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}
