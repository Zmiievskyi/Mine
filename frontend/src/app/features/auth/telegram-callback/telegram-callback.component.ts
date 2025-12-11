import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { TelegramAuthData } from '../../../core/models/user.model';

@Component({
  selector: 'app-telegram-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './telegram-callback.component.html',
})
export class TelegramCallbackComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);

  error = signal<string | null>(null);

  ngOnInit(): void {
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
      const data: TelegramAuthData = JSON.parse(atob(tgAuthResult));

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
