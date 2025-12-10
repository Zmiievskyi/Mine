import { Component, Input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HlmButton } from '@spartan-ng/helm/button';
import { EmailVerificationBannerComponent } from '../email-verification-banner/email-verification-banner.component';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HlmButton, EmailVerificationBannerComponent],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  @Input() pageTitle = '';

  authService = inject(AuthService);
  currentUser = toSignal(this.authService.currentUser$);

  // Show banner only for local auth users who haven't verified email
  showVerificationBanner = computed(() => {
    const user = this.currentUser();
    return user?.provider === 'local' && user?.emailVerified === false;
  });

  logout(): void {
    this.authService.logout();
  }
}
