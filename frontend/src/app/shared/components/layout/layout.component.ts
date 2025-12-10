import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HlmButton } from '@spartan-ng/helm/button';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, HlmButton],
  templateUrl: './layout.component.html',
})
export class LayoutComponent {
  @Input() pageTitle = '';

  authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}
