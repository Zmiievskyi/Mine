import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap, firstValueFrom, timeout } from 'rxjs';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  TelegramAuthData,
} from '../models/user.model';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

const USER_KEY = 'user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);

  // In-memory token storage (NOT in localStorage for security)
  private accessToken = signal<string | null>(null);

  // User stored in localStorage for persistence across page reloads
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());

  // Refresh state management - single promise for concurrent request deduplication
  private refreshPromise: Promise<string> | null = null;

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  readonly isAdmin$ = this.currentUser$.pipe(map(user => user?.role === 'admin'));

  // Sync getters for guards/interceptors
  get currentUser(): User | null { return this.currentUserSubject.value; }
  get isAuthenticated(): boolean { return !!this.currentUserSubject.value; }
  get isAdmin(): boolean { return this.currentUserSubject.value?.role === 'admin'; }

  /**
   * Get current access token from memory.
   */
  getToken(): string | null {
    return this.accessToken();
  }

  /**
   * Login with email and password.
   * Sets access token in memory and user in localStorage.
   */
  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/login`,
      credentials,
      { withCredentials: true }
    ).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  /**
   * Register a new user.
   * Sets access token in memory and user in localStorage.
   */
  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/register`,
      data,
      { withCredentials: true }
    ).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  /**
   * Verify email with code.
   */
  verifyEmail(code: string): Observable<{ message: string; verified: boolean }> {
    return this.http.post<{ message: string; verified: boolean }>(
      `${this.apiUrl}/verify-email`,
      { code },
      { withCredentials: true }
    ).pipe(
      tap((response) => {
        if (response.verified) {
          const currentUser = this.currentUser;
          if (currentUser) {
            const updatedUser = { ...currentUser, emailVerified: true };
            this.storage.setJson(USER_KEY, updatedUser);
            this.currentUserSubject.next(updatedUser);
          }
        }
      })
    );
  }

  /**
   * Resend verification code.
   */
  resendVerification(): Observable<{ message: string; expiresAt: string }> {
    return this.http.post<{ message: string; expiresAt: string }>(
      `${this.apiUrl}/resend-verification`,
      {},
      { withCredentials: true }
    );
  }

  /**
   * Logout and revoke refresh token.
   * Calls backend to revoke refresh token, then clears local state.
   */
  logout(): void {
    // Call backend to revoke refresh token (fire and forget)
    this.http.post(
      `${this.apiUrl}/logout`,
      {},
      { withCredentials: true }
    ).subscribe({
      complete: () => this.clearAuthState(),
      error: () => this.clearAuthState(), // Clear even on error
    });
  }

  /**
   * Clear all auth state (token, user, navigate to home).
   */
  private clearAuthState(): void {
    this.accessToken.set(null);
    this.storage.remove(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  /**
   * Refresh access token using refresh token cookie.
   * Returns a promise that resolves to the new access token.
   * Handles concurrent refresh requests by sharing the same promise (atomic check).
   */
  async refreshToken(): Promise<string> {
    // Atomic check: if promise exists, return it (handles concurrent requests)
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    // Create promise atomically - no race condition possible
    this.refreshPromise = this.performTokenRefresh();
    return this.refreshPromise;
  }

  /**
   * Performs the actual token refresh HTTP call.
   * Separated to ensure cleanup happens in finally block.
   */
  private async performTokenRefresh(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ accessToken: string }>(
          `${this.apiUrl}/refresh`,
          {},
          { withCredentials: true }
        ).pipe(
          timeout(10000) // 10 second timeout to prevent hanging
        )
      );
      this.accessToken.set(response.accessToken);
      return response.accessToken;
    } catch (error) {
      this.clearAuthState();
      throw error;
    } finally {
      // Always clear the promise so next refresh can proceed
      this.refreshPromise = null;
    }
  }

  /**
   * Initialize auth state on app startup.
   * If user exists in storage, try to refresh token.
   * Returns a promise that resolves when initialization is complete.
   */
  async initializeAuth(): Promise<void> {
    const user = this.loadUserFromStorage();
    if (user) {
      try {
        await this.refreshToken();
      } catch {
        // Refresh failed, user will be logged out
        this.clearAuthState();
      }
    }
  }

  /**
   * Redirects to Google OAuth login page.
   * NOTE: Uses window.location.href intentionally (not Router) because OAuth
   * requires a full page redirect to the OAuth provider's domain.
   */
  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  /**
   * Redirects to GitHub OAuth login page.
   * NOTE: Uses window.location.href intentionally (not Router) because OAuth
   * requires a full page redirect to the OAuth provider's domain.
   */
  loginWithGithub(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  /**
   * Redirects to Telegram OAuth login page.
   * NOTE: Uses window.location.href intentionally because Telegram OAuth
   * requires a full page redirect to their OAuth domain.
   */
  loginWithTelegram(): void {
    const botId = environment.telegramBotId;
    if (!botId) {
      console.error('Telegram bot ID not configured');
      return;
    }
    const origin = encodeURIComponent(window.location.origin);
    const returnTo = encodeURIComponent(`${window.location.origin}/auth/telegram-callback`);
    window.location.href = `https://oauth.telegram.org/auth?bot_id=${botId}&origin=${origin}&return_to=${returnTo}&embed=0`;
  }

  /**
   * Verifies Telegram auth data with the backend.
   * Unlike Google/GitHub which use redirects, Telegram returns data to the frontend
   * which must then be sent to the backend for verification.
   */
  verifyTelegramAuth(data: TelegramAuthData): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(
      `${this.apiUrl}/telegram/verify`,
      data,
      { withCredentials: true }
    ).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  /**
   * Handle OAuth callback - stores access token in memory and user in localStorage.
   * Refresh token is already set as HttpOnly cookie by the backend.
   */
  handleOAuthCallback(token: string, userJson: string): boolean {
    try {
      const user: User = JSON.parse(userJson);
      this.accessToken.set(token);
      this.storage.setJson(USER_KEY, user);
      this.currentUserSubject.next(user);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Handle auth response - stores access token in memory and user in localStorage.
   */
  private handleAuthResponse(response: AuthResponse): void {
    this.accessToken.set(response.accessToken);
    this.storage.setJson(USER_KEY, response.user);
    this.currentUserSubject.next(response.user);
  }

  /**
   * Load user from localStorage.
   */
  private loadUserFromStorage(): User | null {
    return this.storage.getJson<User>(USER_KEY);
  }
}
