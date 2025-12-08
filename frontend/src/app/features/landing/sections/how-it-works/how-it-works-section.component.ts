import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Interface for mining step configuration
 */
interface MiningStep {
  stepNumber: number;
  title: string;
  description: string;
  imagePosition: 'left' | 'right';
}

/**
 * How It Works Section Component
 *
 * Displays a 3-step process for users to start mining:
 * - KYC Verification
 * - Contract Signing & Payment
 * - Mining Setup & Earnings
 *
 * Features alternating image layout for visual interest.
 *
 * Usage:
 * <app-how-it-works-section></app-how-it-works-section>
 */
@Component({
  selector: 'app-how-it-works-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './how-it-works-section.component.html',
  styleUrl: './how-it-works-section.component.scss'
})
export class HowItWorksSectionComponent {
  /**
   * Configuration for the 3-step mining process.
   * Images alternate left/right for better visual flow.
   */
  readonly steps: MiningStep[] = [
    {
      stepNumber: 1,
      title: 'Complete KYC Verification',
      description: 'Submit your form and go through our KYC procedure to verify your identity and ensure compliance with regulations.',
      imagePosition: 'left'
    },
    {
      stepNumber: 2,
      title: 'Sign Contract and Pay',
      description: 'Review and sign your mining contract, then make the payment for your first month to secure your GPU allocation.',
      imagePosition: 'right'
    },
    {
      stepNumber: 3,
      title: 'Start Mining and Earn',
      description: 'We set up your GPUs and provide access to mining statistics. Start receiving daily payouts to your GNK token wallet.',
      imagePosition: 'left'
    }
  ];
}
