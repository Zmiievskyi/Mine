import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
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
          <div>
            <label for="email" class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              [(ngModel)]="email"
              required
              class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--gcore-primary)]"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-[var(--gcore-text)] mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              [(ngModel)]="password"
              required
              class="w-full px-3 py-2 border border-[var(--gcore-border)] rounded focus:outline-none focus:ring-2 focus:ring-[var(--gcore-primary)]"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full py-2 px-4 bg-[var(--gcore-primary)] text-white rounded hover:bg-[var(--gcore-primary-hover)] disabled:opacity-50 transition-colors"
          >
            @if (loading()) {
              Signing in...
            } @else {
              Sign in
            }
          </button>
        </form>

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
export class LoginComponent {
  email = '';
  password = '';
  loading = signal(false);
  error = signal<string | null>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService.login({ email: this.email, password: this.password }).subscribe({
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
