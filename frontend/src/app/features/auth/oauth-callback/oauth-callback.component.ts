import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div
      class="min-h-screen flex items-center justify-center bg-[var(--gcore-bg)]"
    >
      <div
        class="w-full max-w-md p-8 bg-white rounded-lg shadow-md text-center"
      >
        @if (error()) {
          <div class="text-red-600">
            <svg
              class="w-16 h-16 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h2 class="text-xl font-semibold mb-2">Authentication Failed</h2>
            <p class="text-gray-600 mb-4">{{ error() }}</p>
            <a
              routerLink="/auth/login"
              class="text-[var(--gcore-primary)] hover:underline"
            >
              Return to login
            </a>
          </div>
        } @else {
          <div class="text-gray-600">
            <svg
              class="animate-spin w-12 h-12 mx-auto mb-4 text-[var(--gcore-primary)]"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                class="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                stroke-width="4"
              />
              <path
                class="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <p>Completing sign in...</p>
          </div>
        }
      </div>
    </div>
  `,
})
export class OAuthCallbackComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  error = signal<string | null>(null);

  ngOnInit(): void {
    // Check for error in query params (errors are still sent via query params)
    const queryParams = this.route.snapshot.queryParams;
    if (queryParams['error']) {
      this.error.set(decodeURIComponent(queryParams['error']));
      return;
    }

    // Read token from URL fragment (#) for security
    // Fragments are not sent to server, not logged, not in Referrer header
    const fragment = window.location.hash.substring(1); // Remove the # character
    const params = new URLSearchParams(fragment);

    const token = params.get('token');
    const user = params.get('user');

    // Clear the fragment from URL immediately for security
    window.history.replaceState(null, '', window.location.pathname);

    if (!token || !user) {
      this.error.set('Invalid authentication response');
      return;
    }

    const success = this.authService.handleOAuthCallback(token, user);

    if (success) {
      this.router.navigate(['/dashboard']);
    } else {
      this.error.set('Failed to complete authentication');
    }
  }
}
