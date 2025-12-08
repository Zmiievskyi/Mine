import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Pricing section component for MineGNK landing page
 *
 * Displays three GPU mining packages:
 * - A100 Basic (entry-level)
 * - A100 Premium (enhanced features)
 * - A200 Enterprise (maximum performance)
 *
 * Each card includes:
 * - GPU specifications
 * - Feature list with checkmarks
 * - Hourly pricing
 * - Call-to-action button
 *
 * Design matches minegnk.com reference with dark theme
 * and purple accent colors
 */
@Component({
  selector: 'app-pricing-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pricing-section.component.html',
  styleUrl: './pricing-section.component.scss'
})
export class PricingSectionComponent {
  /**
   * Pricing package data
   * Each package includes tier, name, description, features, price, and CTA
   */
  packages = [
    {
      tier: 'Basic',
      name: 'A100 Basic',
      description: 'High-performance GPU for entry-level mining',
      features: [
        '40GB HBM2e memory',
        '6,912 CUDA cores',
        'Tensor performance optimized',
        '24/7 monitoring',
        'Email support'
      ],
      price: 1,
      cta: 'Start Mining',
      highlighted: false
    },
    {
      tier: 'Premium',
      name: 'A100 Premium',
      description: 'Enhanced A100 with premium features and support',
      features: [
        '80GB HBM2e memory',
        '6,912 CUDA cores',
        'Advanced cooling',
        'Priority support',
        'Advanced analytics & API access'
      ],
      price: 1.55,
      cta: 'Go Premium',
      highlighted: true // Middle card highlight
    },
    {
      tier: 'Enterprise',
      name: 'A200 Enterprise',
      description: 'Next-generation GPU for maximum performance',
      features: [
        'Latest GPU architecture',
        'Maximum performance',
        'Dedicated support & SLA guarantees',
        'Custom integrations',
        'Volume discounts'
      ],
      price: 1.99,
      cta: 'Contact Sales',
      highlighted: false
    }
  ];

  /**
   * Handle CTA button clicks
   * Routes to appropriate action based on package tier
   */
  onSelectPackage(packageTier: string): void {
    if (packageTier === 'Enterprise') {
      // TODO: Open contact form or navigate to contact page
      console.log('Navigate to contact sales');
    } else {
      // TODO: Navigate to registration/signup
      console.log('Navigate to registration with package:', packageTier);
    }
  }
}
