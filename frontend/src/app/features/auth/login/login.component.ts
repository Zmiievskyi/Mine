import { Component, OnInit, signal, inject, DestroyRef, ChangeDetectionStrategy } from '@angular/core';
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
  TelegramOAuthButtonComponent,
} from '../../../shared/components';

@Component({
  selector: 'app-login',
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
  templateUrl: './login.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  public email = '';
  public password = '';
  public rememberMe = false;
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  public ngOnInit(): void {
    const errorParam = this.route.snapshot.queryParams['error'];
    if (errorParam) {
      this.error.set(decodeURIComponent(errorParam));
    }
  }

  protected loginWithGoogle(): void {
    this.authService.loginWithGoogle();
  }

  protected loginWithGithub(): void {
    this.authService.loginWithGithub();
  }

  protected loginWithTelegram(): void {
    this.authService.loginWithTelegram();
  }

  protected onSubmit(): void {
    if (!this.email || !this.password) {
      this.error.set('Please fill in all fields');
      return;
    }

    this.loading.set(true);
    this.error.set(null);

    this.authService
      .login({ email: this.email, password: this.password, rememberMe: this.rememberMe })
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
