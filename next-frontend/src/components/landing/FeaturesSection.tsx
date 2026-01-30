'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

export function FeaturesSection() {
  const t = useTranslations('features');

  const features = [
    {
      title: t('fiat.title'),
      description: t('fiat.description'),
    },
    {
      title: t('enterprise.title'),
      description: t('enterprise.description'),
    },
    {
      title: t('aiTokens.title'),
      description: t('aiTokens.description'),
    },
  ];

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              {t('badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="rounded-xl border border-border bg-card/30 p-6 hover:bg-card/50 transition-colors h-full">
                <h3 className="text-lg font-semibold text-foreground mb-3">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {feature.description}
                </p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
