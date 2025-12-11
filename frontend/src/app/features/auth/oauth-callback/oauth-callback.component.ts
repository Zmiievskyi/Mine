import { Component, OnInit, signal, inject, ChangeDetectionStrategy } from '@angular/core';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-oauth-callback',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './oauth-callback.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OAuthCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  protected readonly error = signal<string | null>(null);

  public ngOnInit(): void {
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
