import { Component, signal, inject, DestroyRef, ViewChildren, QueryList, ElementRef, afterNextRender, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [HlmButton],
  templateUrl: './verify-email.component.html',
})
export class VerifyEmailComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  private notify = inject(NotificationService);

  @ViewChildren('digitInput') digitInputs!: QueryList<ElementRef<HTMLInputElement>>;

  digits = signal<string[]>(['', '', '', '', '', '']);
  loading = signal(false);
  resending = signal(false);
  error = signal<string | null>(null);
  resendCooldown = signal(0);

  userEmail = signal(this.authService.currentUser?.email || '');

  private cooldownInterval?: number;

  constructor() {
    // Auto-focus first input on component load
    afterNextRender(() => {
      this.focusInput(0);
    });
  }

  ngOnInit(): void {
    // Redirect to dashboard if user is already verified
    // (email verification is currently disabled - all users are auto-verified)
    const user = this.authService.currentUser;
    if (user?.emailVerified) {
      this.router.navigate(['/dashboard']);
    }
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Only allow digits
    if (value && !/^\d$/.test(value)) {
      input.value = '';
      return;
    }

    // Update signal
    const currentDigits = [...this.digits()];
    currentDigits[index] = value;
    this.digits.set(currentDigits);

    // Clear error when user starts typing
    if (this.error()) {
      this.error.set(null);
    }

    // Auto-focus next input
    if (value && index < 5) {
      this.focusInput(index + 1);
    }

    // Auto-submit when all digits are filled
    if (this.isComplete()) {
      this.verify();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    // Handle backspace
    if (event.key === 'Backspace') {
      const currentDigits = [...this.digits()];

      if (!currentDigits[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        this.focusInput(index - 1);
        currentDigits[index - 1] = '';
        this.digits.set(currentDigits);
      } else if (currentDigits[index]) {
        // Clear current input
        currentDigits[index] = '';
        this.digits.set(currentDigits);
      }

      event.preventDefault();
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasteData = event.clipboardData?.getData('text') || '';

    // Extract only digits
    const digits = pasteData.replace(/\D/g, '').slice(0, 6).split('');

    if (digits.length === 6) {
      this.digits.set(digits);

      // Update all inputs
      this.digitInputs.forEach((input, index) => {
        input.nativeElement.value = digits[index] || '';
      });

      // Focus last input
      this.focusInput(5);

      // Auto-submit
      this.verify();
    }
  }

  isComplete(): boolean {
    return this.digits().every(digit => digit !== '');
  }

  verify(): void {
    if (!this.isComplete() || this.loading()) {
      return;
    }

    const code = this.digits().join('');
    this.loading.set(true);
    this.error.set(null);

    this.authService
      .verifyEmail(code)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.loading.set(false);
          if (response.verified) {
            this.notify.success('Email verified successfully!');
            this.router.navigate(['/dashboard']);
          }
        },
        error: (err) => {
          this.loading.set(false);
          const errorMessage = err.error?.message || 'Verification failed. Please try again.';
          this.error.set(errorMessage);

          // Clear all inputs on error
          this.digits.set(['', '', '', '', '', '']);
          this.digitInputs.forEach(input => {
            input.nativeElement.value = '';
          });
          this.focusInput(0);
        },
      });
  }

  resendCode(): void {
    if (this.resending() || this.resendCooldown() > 0) {
      return;
    }

    this.resending.set(true);
    this.error.set(null);

    this.authService
      .resendVerification()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.resending.set(false);
          this.notify.success('Verification code sent!');
          this.startCooldown();
        },
        error: (err) => {
          this.resending.set(false);
          const errorMessage = err.error?.message || 'Failed to resend code. Please try again.';
          this.error.set(errorMessage);
        },
      });
  }

  private startCooldown(): void {
    this.resendCooldown.set(60);

    if (this.cooldownInterval) {
      clearInterval(this.cooldownInterval);
    }

    this.cooldownInterval = window.setInterval(() => {
      const current = this.resendCooldown();
      if (current > 0) {
        this.resendCooldown.set(current - 1);
      } else {
        if (this.cooldownInterval) {
          clearInterval(this.cooldownInterval);
          this.cooldownInterval = undefined;
        }
      }
    }, 1000);
  }

  private focusInput(index: number): void {
    const inputs = this.digitInputs.toArray();
    if (inputs[index]) {
      inputs[index].nativeElement.focus();
    }
  }
}
