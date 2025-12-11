import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * How It Works section component for landing page
 *
 * Displays 3-step process:
 * 1. Complete KYC verification
 * 2. Sign contract and pay
 * 3. Start mining and earn
 */
@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './how-it-works-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksSectionComponent {}
