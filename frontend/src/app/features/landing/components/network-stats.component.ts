import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NetworkStats } from '../../../core/models/node.model';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Network stats component for landing page
 *
 * Displays live Gonka network statistics:
 * - Current epoch and block number
 * - Active nodes (total, healthy, catching up)
 * - Registered AI models
 * - Time until next epoch
 *
 * Updates automatically via parent component
 */
@Component({
  selector: 'app-network-stats',
  standalone: true,
  imports: [CommonModule, ScrollRevealDirective],
  templateUrl: './network-stats.component.html',
})
export class NetworkStatsComponent {
  stats = input<NetworkStats | null>(null);
  loading = input<boolean>(true);
}
