import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * FAQ section component for landing page
 *
 * Displays frequently asked questions about:
 * - Mining as a service concept
 * - Payment structure
 * - GNK tokens
 * - Scaling capabilities
 * - Performance tracking
 */
@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [RouterModule, ScrollRevealDirective],
  templateUrl: './faq-section.component.html',
})
export class FaqSectionComponent {}
