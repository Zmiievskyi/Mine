'use client';

import { ScrollReveal } from '@/components/ui/ScrollReveal';

const steps = [
  {
    number: 1,
    title: 'Submit Request',
    description:
      'Choose your GPU model, preferred region, and contract duration. We\'ll check availability and prepare your quote.',
  },
  {
    number: 2,
    title: 'Complete KYC',
    description:
      'After KYC verification is done. We provide a clear checklist of required documentation to streamline the process.',
  },
  {
    number: 3,
    title: 'Review Quote',
    description:
      'Confirm availability and fit before committing. Review your configuration and pricing details.',
  },
  {
    number: 4,
    title: 'Sign & Pay',
    description:
      'Sign a 1-month contract and pay for the first month upfront. Payment is required before server assignment.',
  },
  {
    number: 5,
    title: 'Provisioning',
    description:
      'We handle server assignment, software installation, and wallet connection. Provisioning completes within days.',
  },
  {
    number: 6,
    title: 'Operate & Monitor',
    description:
      'Your GPUs start mining. We provide 24/7 infrastructure monitoring and respond to any issues automatically.',
  },
  {
    number: 7,
    title: 'Billing & Renewal',
    description:
      'Monthly invoices at calendar month end. Renew by paying no later than 10 days before contract end. Downtime credits applied automatically.',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              How it works
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              From request to mining in 7 steps
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We handle the infrastructure while you focus on earning tokens.
              Month-to-month contracts with no long-term commitment.
            </p>
          </div>
        </ScrollReveal>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <ScrollReveal
              key={step.number}
              delay={index * 50}
              className={
                step.number === 7
                  ? 'md:col-span-2 lg:col-span-1 lg:col-start-2'
                  : ''
              }
            >
              <div className="rounded-xl border border-border bg-card/30 p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#FF4C00]/10 border border-[#FF4C00]/30 flex items-center justify-center text-sm font-bold text-[#FF4C00]">
                    {step.number}
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">
                    {step.title}
                  </h3>
                </div>
                <p className="text-muted-foreground text-sm">{step.description}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Billing Note */}
        <ScrollReveal delay={350}>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="text-[#FF4C00]">Note:</span> Infrastructure
              downtime credits apply to infrastructure issues only and do not
              cover missed network rewards.
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
