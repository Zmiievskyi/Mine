import { Component, ChangeDetectionStrategy, Input, inject, computed } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { EmailVerificationBannerComponent } from '../email-verification-banner/email-verification-banner.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [AsyncPipe, RouterLink, RouterLinkActive, HlmButton, EmailVerificationBannerComponent],
  templateUrl: './layout.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  @Input() pageTitle = '';

  protected readonly authService = inject(AuthService);
  protected readonly currentUser = toSignal(this.authService.currentUser$);

  // Show banner only for local auth users who haven't verified email
  protected readonly showVerificationBanner = computed(() => {
    const user = this.currentUser();
    return user?.provider === 'local' && user?.emailVerified === false;
  });

  protected getDisplayName(): string {
    const user = this.currentUser();
    return user?.name || user?.telegramUsername || user?.email || 'User';
  }

  protected getInitial(): string {
    return this.getDisplayName().charAt(0).toUpperCase();
  }

  protected logout(): void {
    this.authService.logout();
  }
}
