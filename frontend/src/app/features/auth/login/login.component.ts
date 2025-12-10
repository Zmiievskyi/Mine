import { Component, OnInit, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { HlmInput } from '@spartan-ng/helm/input';
import { HlmLabel } from '@spartan-ng/helm/label';
import {
  GoogleOAuthButtonComponent,
  GithubOAuthButtonComponent,
} from '../../../shared/components';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    HlmButton,
    HlmInput,
    HlmLabel,
    GoogleOAuthButtonComponent,
    GithubOAuthButtonComponent,
  ],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-[var(--gcore-bg)]">
      <div class="w-full max-w-md p-8 bg-white rounded-lg shadow-md">
        <div class="text-center mb-8">
          <h1 class="text-2xl font-bold text-[var(--gcore-text)]">MineGNK</h1>
          <p class="text-[var(--gcore-text-muted)] mt-2">Sign in to your account</p>
        </div>

        @if (error()) {
          <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="space-y-2">
            <label hlmLabel for="email">Email</label>
            <input
              hlmInput
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              placeholder="you@example.com"
              class="w-full"
            />
          </div>

          <div class="space-y-2">
            <label hlmLabel for="password">Password</label>
            <input
              hlmInput
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              placeholder="••••••••"
              class="w-full"
            />
          </div>

          <button hlmBtn type="submit" [disabled]="loading()" class="w-full">
            @if (loading()) {
              Signing in...
            } @else {
              Sign in
            }
          </button>
        </form>

        <div class="relative my-6">
          <div class="absolute inset-0 flex items-center">
            <div class="w-full border-t border-[var(--gcore-border)]"></div>
          </div>
          <div class="relative flex justify-center text-sm">
            <span class="px-2 bg-white text-[var(--gcore-text-muted)]">Or continue with</span>
          </div>
        </div>

        <app-google-oauth-button
          [disabled]="loading()"
          (clicked)="loginWithGoogle()"
        />

        <app-github-oauth-button
          class="mt-3 block"
          [disabled]="loading()"
          (clicked)="loginWithGithub()"
        />

        <p class="mt-6 text-center text-sm text-[var(--gcore-text-muted)]">
          Don't have an account?
          <a routerLink="/auth/register" class="text-[var(--gcore-primary)] hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  `,
})
export class LoginComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroyRef = inject(DestroyRef);

  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam) {
      this.error.set(decodeURIComponent(errorParam));
    }
  }

  loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  loginWithGithub(): void {
    this.authService.loginWithGithub();
  }

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService
      .login({ email: this.email, password: this.password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Login failed. Please try again.');
        },
      });
  }
}
