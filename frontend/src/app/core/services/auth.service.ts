import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import {
  User,
  LoginRequest,
  RegisterRequest,
  AuthResponse,
} from '../models/user.model';
import { environment } from '../../../environments/environment';
import { StorageService } from './storage.service';

const TOKEN_KEY = 'access_token';
const USER_KEY = 'user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly apiUrl = `${environment.apiUrl}/auth`;
  private http = inject(HttpClient);
  private router = inject(Router);
  private storage = inject(StorageService);

  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUserFromStorage());

  readonly currentUser$ = this.currentUserSubject.asObservable();
  readonly isAuthenticated$ = this.currentUser$.pipe(map(user => !!user));
  readonly isAdmin$ = this.currentUser$.pipe(map(user => user?.role === 'admin'));

  // Sync getters for guards/interceptors
  get currentUser(): User | null { return this.currentUserSubject.value; }
  get isAuthenticated(): boolean { return !!this.currentUserSubject.value; }
  get isAdmin(): boolean { return this.currentUserSubject.value?.role === 'admin'; }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => this.handleAuthResponse(response))
    );
  }

  logout(): void {
    this.storage.remove(TOKEN_KEY);
    this.storage.remove(USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/']);
  }

  getToken(): string | null {
    return this.storage.get(TOKEN_KEY);
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

  handleOAuthCallback(token: string, userJson: string): boolean {
    try {
      const user: User = JSON.parse(userJson);
      this.storage.set(TOKEN_KEY, token);
      this.storage.set(USER_KEY, userJson);
      this.currentUserSubject.next(user);
      return true;
    } catch {
      return false;
    }
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.storage.set(TOKEN_KEY, response.accessToken);
    this.storage.setJson(USER_KEY, response.user);
    this.currentUserSubject.next(response.user);
  }

  private loadUserFromStorage(): User | null {
    return this.storage.getJson<User>(USER_KEY);
  }
}
