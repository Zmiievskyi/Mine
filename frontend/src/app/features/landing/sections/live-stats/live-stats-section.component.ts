import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface NetworkStat {
  label: string;
  value: string;
  subtext: string;
}

@Component({
  selector: 'app-live-stats-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './live-stats-section.component.html'
})
export class LiveStatsSectionComponent {
  /**
   * Network statistics displayed in the live stats section.
   * TODO: Replace with real-time data from Gonka API (node1.gonka.ai:8000/v1/epochs/current)
   */
  stats: NetworkStat[] = [
    {
      label: 'Latest Block',
      value: '#1635739',
      subtext: 'Updated just now'
    },
    {
      label: 'Active Participants',
      value: '477',
      subtext: 'Catching up: No'
    },
    {
      label: 'Registered Models',
      value: '5',
      subtext: 'Public listing at time of load'
    }
  ];
}
