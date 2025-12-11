import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TelegramAuthData } from '../../../core/models/user.model';

@Component({
  selector: 'app-telegram-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './telegram-callback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TelegramCallbackComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly error = signal<string | null>(null);

  public ngOnInit(): void {
    // Telegram returns: #tgAuthResult=BASE64_ENCODED_JSON
    const fragment = window.location.hash.substring(1);
    const params = new URLSearchParams(fragment);
    const tgAuthResult = params.get('tgAuthResult');

    // Clear the fragment from URL immediately for security
    window.history.replaceState(null, '', window.location.pathname);

    if (!tgAuthResult) {
      this.error.set('No Telegram authentication data received');
      return;
    }

    try {
      // Decode base64 -> JSON
      const decoded = atob(tgAuthResult);

      // Telegram returns "false" when auth fails (domain mismatch, user cancelled, etc.)
      if (decoded === 'false') {
        this.error.set(
          'Telegram authentication was denied. This may be due to domain configuration. Please contact support.'
        );
        return;
      }

      const data: TelegramAuthData = JSON.parse(decoded);

      // Verify with backend
      this.authService.verifyTelegramAuth(data).subscribe({
        next: () => {
          this.router.navigate(['/dashboard']);
        },
        error: (err) => {
          const message = err.error?.message || 'Telegram login failed';
          this.error.set(message);
        },
      });
    } catch {
      this.error.set('Invalid Telegram authentication data');
    }
  }
}
