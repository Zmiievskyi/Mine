import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
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

  private currentUserSignal = signal<User | null>(this.loadUserFromStorage());

  readonly currentUser = this.currentUserSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.currentUserSignal());
  readonly isAdmin = computed(
    () => this.currentUserSignal()?.role === 'admin'
  );

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
    this.currentUserSignal.set(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return this.storage.get(TOKEN_KEY);
  }

  loginWithGoogle(): void {
    window.location.href = `${environment.apiUrl}/auth/google`;
  }

  loginWithGithub(): void {
    window.location.href = `${environment.apiUrl}/auth/github`;
  }

  handleOAuthCallback(token: string, userJson: string): boolean {
    try {
      const user: User = JSON.parse(userJson);
      this.storage.set(TOKEN_KEY, token);
      this.storage.set(USER_KEY, userJson);
      this.currentUserSignal.set(user);
      return true;
    } catch {
      return false;
    }
  }

  private handleAuthResponse(response: AuthResponse): void {
    this.storage.set(TOKEN_KEY, response.accessToken);
    this.storage.setJson(USER_KEY, response.user);
    this.currentUserSignal.set(response.user);
  }

  private loadUserFromStorage(): User | null {
    return this.storage.getJson<User>(USER_KEY);
  }
}
