import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * How It Works section component for landing page
 *
 * Displays 7-step onboarding process:
 * 1. Submit request - GPU model, region, duration preferences
 * 2. Complete KYC - Verification with documentation checklist
 * 3. Review quote - Confirm availability and fit before committing
 * 4. Sign contract and pay - 1-month contract, pay first month upfront
 * 5. Provisioning - Server assignment, software installation, wallet connection
 * 6. Operate and monitor - Infrastructure monitoring and issue response
 * 7. Billing and renewal - Monthly invoicing with adjustment credits
 */
@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './how-it-works-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HowItWorksSectionComponent {}
