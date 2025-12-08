import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

/**
 * CTA (Call-to-Action) section component for MineGNK landing page
 *
 * Features:
 * - Centered content with heading and subtitle
 * - Primary action button with arrow icon
 * - Routes to signup/registration page
 * - Responsive design with mobile-first approach
 *
 * Usage:
 * <app-cta-section />
 */
@Component({
  selector: 'app-cta-section',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './cta-section.component.html',
  styleUrls: ['./cta-section.component.scss']
})
export class CtaSectionComponent {
  /**
   * Navigate to signup page
   * TODO: Update route when auth module is implemented
   */
  readonly signupRoute = '/auth/signup';
}
