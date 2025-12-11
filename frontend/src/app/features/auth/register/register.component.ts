import { Component, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
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
  TelegramOAuthButtonComponent,
} from '../../../shared/components';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    HlmButton,
    HlmInput,
    HlmLabel,
    GoogleOAuthButtonComponent,
    GithubOAuthButtonComponent,
    TelegramOAuthButtonComponent,
  ],
  templateUrl: './register.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  public name = '';
  public email = '';
  public password = '';
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  protected signUpWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  protected signUpWithGithub(): void {
    this.authService.loginWithGithub();
  }

  protected signUpWithTelegram(): void {
    this.authService.loginWithTelegram();
  }

  protected onSubmit(): void {
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
          // Email verification disabled - go straight to dashboard
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err.error?.message || 'Registration failed. Please try again.');
        },
      });
  }
}
