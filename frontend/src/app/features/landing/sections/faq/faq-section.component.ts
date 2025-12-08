import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * FAQ item model
 */
interface FAQItem {
  question: string;
  answer: string;
  isOpen: boolean;
}

/**
 * FAQ Section Component
 *
 * Displays frequently asked questions about MineGNK in an accordion-style layout.
 * Users can click questions to expand/collapse answers.
 *
 * Usage:
 *   <app-faq-section></app-faq-section>
 */
@Component({
  selector: 'app-faq-section',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './faq-section.component.html',
  styleUrl: './faq-section.component.scss'
})
export class FaqSectionComponent {
  /**
   * FAQ items displayed in the accordion
   * Content matches the MineGNK landing page design reference
   */
  faqs: FAQItem[] = [
    {
      question: 'What is mining as a service?',
      answer: 'We provision and manage enterprise-grade GPUs for you. You pay in fiat and earn AI-focused tokens while we handle the infrastructure.',
      isOpen: false
    },
    {
      question: 'How do I get paid?',
      answer: 'You receive daily payouts to your GNK token wallet. We provide real-time monitoring and transparent reporting.',
      isOpen: false
    },
    {
      question: 'What makes Gonka tokens special?',
      answer: 'GNK is designed for AI inference workloads in the Gonka network, aligning rewards with real compute supply and demand.',
      isOpen: false
    },
    {
      question: 'Can I scale my mining operation?',
      answer: 'Yes. Start small and scale up capacity as you grow. Our team helps you expand without disrupting uptime.',
      isOpen: false
    },
    {
      question: 'How can I track performance?',
      answer: 'Use our dashboard for live stats, daily earnings, and historical trends. We also expose APIs for deeper integration.',
      isOpen: false
    }
  ];

  /**
   * Toggles the open/closed state of an FAQ item
   * Allows multiple FAQs to be open simultaneously
   */
  toggleFaq(index: number): void {
    this.faqs[index].isOpen = !this.faqs[index].isOpen;

    // Optional: Close other FAQs when opening one (single-open accordion)
    // Uncomment below to enable this behavior:
    // this.faqs.forEach((faq, i) => {
    //   if (i !== index) {
    //     faq.isOpen = false;
    //   }
    // });
  }
}
