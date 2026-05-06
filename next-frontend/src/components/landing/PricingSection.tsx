'use client';

import { useTranslations } from 'next-intl';
import { HardLink } from '@/components/ui/HardLink';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { pricing } from '@/data/pricing';

export function PricingSection() {
  const t = useTranslations('pricing');
  const gpuDescriptions = t.raw('gpuDescriptions') as Record<string, string>;

  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-12">
            <span className="inline-flex items-center justify-center rounded-full border border-accent/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
              {t('badge')}
            </span>
            <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">
              {t('title')}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t('subtitle')}
            </p>
          </div>
        </ScrollReveal>

        {/* GPU Server Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricing.map((item, index) => {
            const shortName = item.name.match(/(H100|H200|B200|B300)/)?.[1];
            const description = shortName ? gpuDescriptions[shortName] : undefined;

            return (
              <ScrollReveal key={item.name} delay={index * 75}>
                <div className="group relative h-full">
                  {/* Animated glow border on hover */}
                  <div className="card-glow absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  {/* Card content with glass-morphism */}
                  <div
                    className="
                      relative rounded-xl border border-border bg-card/30 backdrop-blur-md
                      p-6 flex flex-col h-full
                      transition-all duration-300 ease-out
                      group-hover:border-accent/40 group-hover:-translate-y-1
                      group-hover:shadow-[0_0_40px_rgba(255,76,0,0.15)]
                    "
                  >
                    {/* Grid pattern overlay on hover */}
                    <div className="card-grid-pattern absolute inset-0 rounded-xl opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 overflow-hidden" />

                    {/* GPU Name */}
                    <div className="relative z-10 mb-4">
                      <div className="inline-flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                        <h3 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                          {item.name}
                        </h3>
                      </div>
                    </div>

                    {/* Description and availability */}
                    <div className="relative z-10 mb-5 flex-1 flex flex-col gap-2">
                      {description && (
                        <p className="text-sm text-muted-foreground">
                          {description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground">
                        {t('availableOnRequest')}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {t('commitmentOptions')}
                      </p>
                    </div>

                    {/* CTA Button */}
                    <HardLink
                      href={`/request-gpu?gpu=${encodeURIComponent(item.name)}`}
                      className="
                        relative z-10 w-full py-3 px-4
                        bg-accent/90 hover:bg-accent
                        text-white font-semibold text-sm rounded-lg
                        transition-all duration-300
                        group-hover:shadow-[0_0_20px_rgba(255,76,0,0.4)]
                        text-center block
                      "
                    >
                      {t('rentNow')}
                    </HardLink>

                    {/* Corner glow accent */}
                    <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-xl" />
                  </div>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
