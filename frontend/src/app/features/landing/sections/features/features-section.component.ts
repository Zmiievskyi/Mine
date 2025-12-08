import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Feature {
  icon: string;
  title: string;
  description: string;
}

/**
 * Features section component for MineGNK landing page.
 * Displays three key value propositions: fiat payments, enterprise GPUs, and AI tokens.
 *
 * Usage:
 * <app-features-section />
 */
@Component({
  selector: 'app-features-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './features-section.component.html',
  styleUrl: './features-section.component.scss'
})
export class FeaturesSectionComponent {
  /**
   * Feature cards highlighting MineGNK's key benefits.
   * Using emoji icons for simplicity (can be replaced with SVG icons later).
   */
  features: Feature[] = [
    {
      icon: '💳',
      title: 'Pay in Fiat Currency',
      description: 'No wallets or exchanges needed. Onboard fast and start mining immediately.'
    },
    {
      icon: '🖥️',
      title: 'Enterprise-grade GPUs',
      description: 'Access dedicated, high-performance GPUs for reliable, efficient mining.'
    },
    {
      icon: '🤖',
      title: 'AI-Focused Tokens',
      description: 'Earn tokens designed for AI inference workloads across the Gonka network.'
    }
  ];
}
