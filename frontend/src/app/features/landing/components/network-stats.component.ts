import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Network stats component for landing page
 *
 * Displays static Gonka network statistics:
 * - Network status
 * - Current epoch
 * - Participants
 * - Total GPUs
 * - Active AI models
 * - Epoch countdown
 *
 * All values are hardcoded for static landing page
 */
@Component({
  selector: 'app-network-stats',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './network-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkStatsComponent {
  // Hardcoded static stats for display
  protected readonly stats = {
    networkStatus: 'live' as const,
    currentEpoch: '12,847',
    participants: '1,200+',
    healthyParticipants: '1,150+',
    totalGpus: '~8.5K',
    activeModels: '15+',
    countdown: '~4h remaining'
  };
}
