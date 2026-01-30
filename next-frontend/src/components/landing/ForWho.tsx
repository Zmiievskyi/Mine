'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface AudienceCard {
  title: string;
  description: string;
  points: string[];
}

export function ForWho() {
  const t = useTranslations('forWho');

  const audiences: AudienceCard[] = [
    {
      title: t('operators.title'),
      description: t('operators.description'),
      points: t.raw('operators.points') as string[],
    },
    {
      title: t('pools.title'),
      description: t('pools.description'),
      points: t.raw('pools.points') as string[],
    },
  ];

  return (
    <section id="for-who" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-accent/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              {t('badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('title')}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* Audience Cards - 2 columns on desktop, stacked on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {audiences.map((audience, index) => (
            <ScrollReveal key={index} delay={index * 100}>
              <div className="rounded-xl border border-border bg-card/30 p-6 h-full">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {audience.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {audience.description}
                </p>
                <ul className="space-y-3">
                  {audience.points.map((point, pointIndex) => (
                    <li key={pointIndex} className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center mt-0.5">
                        <svg
                          className="w-3 h-3 text-accent"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </span>
                      <span className="text-sm text-muted-foreground">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
