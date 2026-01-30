'use client';

import { ScrollReveal } from '@/components/ui/ScrollReveal';

const faqs = [
  {
    question: 'What is mining as a service?',
    answer:
      'We provision and manage enterprise-grade GPU servers for you. You pay in fiat and earn GNK tokens while we handle all infrastructure — from capacity check and allocation to go-live.',
  },
  {
    question: 'How long does provisioning take?',
    answer:
      'Provisioning typically completes within days after KYC verification and contract signing. We handle server assignment, software installation, and wallet connection end-to-end.',
  },
  {
    question: 'How does billing work?',
    answer:
      'Payment for the first month is required before server assignment. Monthly invoices are issued at calendar month end. Renew by paying no later than 10 days before contract end.',
  },
  {
    question: 'Can I scale my mining operation?',
    answer:
      'Yes. Upgrade is available anytime (subject to capacity). Downgrade is available once per month. Volume discounts are available from 10+ servers.',
  },
  {
    question: 'What support do you provide?',
    answer:
      'We offer 24/7 infrastructure monitoring with business hours support (CET timezone) for infrastructure issues. Network software updates are applied within 24 hours of release.',
  },
  {
    question: "What happens if there's downtime?",
    answer:
      'Infrastructure-caused downtime receives credits applied to your next payment or refunded. Note: credits apply to infrastructure downtime only and do not cover missed network rewards.',
  },
  {
    question: 'What makes Gonka tokens special?',
    answer:
      'GNK is designed for AI inference workloads in the Gonka network. Rewards are aligned with real compute supply and demand, making it a sustainable token economy.',
  },
];

export function FaqSection() {
  return (
    <section id="faq" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl md:text-3xl font-bold">
              What people ask about MineGNK
            </h2>
          </div>
        </ScrollReveal>

        {/* FAQ Items */}
        <div className="max-w-3xl mx-auto space-y-4">
          {faqs.map((faq, index) => (
            <ScrollReveal key={index} delay={index * 50}>
              <div className="rounded-xl border border-border bg-card/30 p-6">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {faq.question}
                </h3>
                <p className="text-muted-foreground text-sm">{faq.answer}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
