import { Component, signal, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
  selector: 'app-register',
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
          <p class="text-[var(--gcore-text-muted)] mt-2">Create your account</p>
        </div>

        @if (error()) {
          <div class="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">
            {{ error() }}
          </div>
        }

        <form (ngSubmit)="onSubmit()" class="space-y-4">
          <div class="space-y-2">
            <label hlmLabel for="name">Name</label>
            <input
              hlmInput
              type="text"
              id="name"
              name="name"
              [(ngModel)]="name"
              required
              placeholder="John Doe"
              class="w-full"
            />
          </div>

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
              minlength="8"
              placeholder="••••••••"
              class="w-full"
            />
          </div>

          <button hlmBtn type="submit" [disabled]="loading()" class="w-full">
            @if (loading()) {
              Creating account...
            } @else {
              Sign up
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
          [label]="'Sign up with Google'"
          [disabled]="loading()"
          (clicked)="signUpWithGoogle()"
        />

        <app-github-oauth-button
          class="mt-3 block"
          [label]="'Sign up with GitHub'"
          [disabled]="loading()"
          (clicked)="signUpWithGithub()"
        />

        <p class="mt-6 text-center text-sm text-[var(--gcore-text-muted)]">
          Already have an account?
          <a routerLink="/auth/login" class="text-[var(--gcore-primary)] hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  `,
})
export class RegisterComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  name = '';
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  signUpWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  signUpWithGithub(): void {
    this.authService.loginWithGithub();
  }

  onSubmit(): void {
    if (!this.name || !this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    if (this.password.length < 8) {
      this.error.set('Password must be at least 8 characters');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(this.password)) {
      this.error.set('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService
      .register({ name: this.name, email: this.email, password: this.password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Registration failed. Please try again.');
        },
      });
  }
}
