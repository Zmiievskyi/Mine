import { Component, ChangeDetectionStrategy, output } from '@angular/core';
import { RouterModule } from '@angular/router';

/**
 * Footer component for landing page
 *
 * Displays:
 * - Brand description
 * - Product links (Features, Pricing, Get Started)
 * - Resources links (How It Works, FAQ, Gonka Network)
 * - Company links (About, Contact, Privacy, Terms)
 * - Copyright notice
 */
@Component({
  selector: 'app-landing-footer',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './landing-footer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LandingFooterComponent {
  public readonly sectionClick = output<string>();
  protected readonly currentYear = new Date().getFullYear();

  protected onSectionClick(sectionId: string): void {
    this.sectionClick.emit(sectionId);
  }
}
