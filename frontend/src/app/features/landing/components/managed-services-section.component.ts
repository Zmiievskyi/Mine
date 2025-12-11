import { Component, ChangeDetectionStrategy } from '@angular/core';
import { ScrollRevealDirective } from '../../../shared/directives/scroll-reveal.directive';

/**
 * Managed services section component for landing page
 *
 * Displays the infrastructure services Gcore handles:
 * - Software deployment
 * - Storage setup (RAID/disks)
 * - Model deployment
 * - Cluster management
 * - Cluster & GPU monitoring
 * - Updates & patches
 */
@Component({
  selector: 'app-managed-services-section',
  standalone: true,
  imports: [ScrollRevealDirective],
  templateUrl: './managed-services-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ManagedServicesSectionComponent {}
