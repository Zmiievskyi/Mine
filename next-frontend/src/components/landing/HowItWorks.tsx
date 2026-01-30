'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface Step {
  title: string;
  description: string;
}

export function HowItWorks() {
  const t = useTranslations('howItWorks');
  const steps = t.raw('steps') as Step[];

  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-accent/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              {t('badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              {t('title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <ScrollReveal
              key={index}
              delay={index * 50}
              className={
                index === 6
                  ? 'md:col-span-2 lg:col-span-1 lg:col-start-2'
                  : ''
              }
            >
              <div className="rounded-xl border border-border bg-card/30 p-6 h-full">
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 border border-accent/30 flex items-center justify-center text-sm font-bold text-accent">
                    {index + 1}
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
              <span className="text-accent">{t('noteLabel')}</span> {t('note')}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
