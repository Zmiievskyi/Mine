import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Pricing section component for landing page
 *
 * Displays GPU mining packages:
 * - A100: €1.67/hour
 * - H100: €2.76/hour
 * - H200: Custom pricing (contact sales)
 *
 * Each card shows GPU specs and features
 */
@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [RouterModule, ScrollRevealDirective],
  templateUrl: './pricing-section.component.html',
})
export class PricingSectionComponent {}
