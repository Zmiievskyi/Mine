import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Hero section component for MineGNK landing page
 *
 * Features:
 * - Badge with "GPU Mining as a Service" pill button
 * - Large responsive heading with gradient "GNK" text
 * - Descriptive subtitle
 * - Call-to-action button
 *
 * Usage:
 * <app-hero-section></app-hero-section>
 */
@Component({
  selector: 'app-hero-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hero-section.component.html',
  styleUrl: './hero-section.component.scss'
})
export class HeroSectionComponent {
  /**
   * Navigate to mining dashboard or registration
   */
  onStartMining(): void {
    // TODO: Implement navigation to registration/dashboard
    console.log('Start mining clicked');
  }

  /**
   * Navigate to feature overview
   */
  onLearnMore(): void {
    // TODO: Implement scroll to features or info section
    console.log('Learn more clicked');
  }
}
