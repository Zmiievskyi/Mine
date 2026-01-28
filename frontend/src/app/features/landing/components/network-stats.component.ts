import { Component, input, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { NetworkStats } from '../../../core/models/node.model';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Network stats component for landing page
 *
 * Displays live Gonka network statistics:
 * - Network status (Live/Syncing/Stale) with block age
 * - Current epoch and block number
 * - Participants (total, healthy)
 * - Total GPUs in the network
 * - Registered AI models
 * - Time until next epoch
 *
 * Updates automatically via parent component
 */
@Component({
  selector: 'app-network-stats',
  standalone: true,
  imports: [DecimalPipe, ScrollRevealDirective],
  templateUrl: './network-stats.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkStatsComponent {
  public readonly stats = input<NetworkStats | null>(null);
  public readonly loading = input<boolean>(true);

  protected getStatusClass(status: string): string {
    switch (status) {
      case 'live':
        return 'bg-green-500/20 text-green-400 border border-green-500/30';
      case 'syncing':
        return 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30';
      case 'stale':
        return 'bg-red-500/20 text-red-400 border border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border border-gray-500/30';
    }
  }

  protected getStatusDotClass(status: string): string {
    switch (status) {
      case 'live':
        return 'bg-green-400';
      case 'syncing':
        return 'bg-yellow-400';
      case 'stale':
        return 'bg-red-400';
      default:
        return 'bg-gray-400';
    }
  }

  protected getStatusLabel(status: string): string {
    switch (status) {
      case 'live':
        return 'Live';
      case 'syncing':
        return 'Syncing';
      case 'stale':
        return 'Stale';
      default:
        return 'Unknown';
    }
  }

  protected formatBlockAge(seconds: number): string {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  }

  protected formatGpuCount(count: number): string {
    if (count >= 1000) {
      return `~${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  }
}
