import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgIconComponent, provideIcons } from '@ng-icons/core';
import { lucideAlertTriangle } from '@ng-icons/lucide';
import { HlmButton } from '@spartan-ng/helm/button';

/**
 * Banner component that prompts unverified users to verify their email.
 * Displayed at the top of authenticated pages for local auth users only.
 */
@Component({
  selector: 'app-email-verification-banner',
  standalone: true,
  imports: [NgIconComponent, HlmButton],
  viewProviders: [provideIcons({ lucideAlertTriangle })],
  template: `
    <div class="bg-amber-50 border-b border-amber-200 px-4 py-3">
      <div class="max-w-7xl mx-auto flex items-center justify-between">
        <div class="flex items-center gap-3">
          <ng-icon name="lucideAlertTriangle" class="text-amber-600" size="20" />
          <span class="text-amber-800 text-sm font-medium">
            Please verify your email to access all features
          </span>
        </div>
        <button hlmBtn size="sm" (click)="navigateToVerify()">Verify Now</button>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmailVerificationBannerComponent {
  private readonly router = inject(Router);

  protected navigateToVerify(): void {
    this.router.navigate(['/auth/verify-email']);
  }
}
