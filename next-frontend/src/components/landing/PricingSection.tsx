'use client';

import { useTranslations } from 'next-intl';
import { HardLink } from '@/components/ui/HardLink';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { pricing, formatPrice, formatMonthlyPrice } from '@/data/pricing';

export function PricingSection() {
  const t = useTranslations('pricing');

  return (
    <section id="pricing" className="py-16 md:py-24">
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

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pricing.map((item, index) => (
            <ScrollReveal key={item.name} delay={index * 75}>
              {/* Glass-morphism Card Container */}
              <div className="group relative h-full">
                {/* Animated glow border on hover */}
                <div
                  className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                  style={{
                    background: `linear-gradient(135deg,
                      rgba(255,76,0,0.5) 0%,
                      rgba(255,76,0,0.1) 50%,
                      rgba(255,76,0,0.5) 100%)`,
                  }}
                />

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
                  <div
                    className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 overflow-hidden"
                    style={{
                      backgroundImage: `linear-gradient(90deg, #FF4C00 1px, transparent 1px),
                                        linear-gradient(180deg, #FF4C00 1px, transparent 1px)`,
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* GPU Name Badge */}
                  <div className="relative z-10 mb-4">
                    <div className="inline-flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                      <h3 className="text-xl font-bold text-foreground transition-colors duration-300 group-hover:text-white">
                        {item.name}
                      </h3>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 min-h-[2.5rem]">
                      {item.description}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="relative z-10 mb-5">
                    {item.isContactSales || item.pricePerMonth === null ? (
                      <span className="text-xl font-bold text-foreground">
                        {t('customPricing')}
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-accent">
                            ${formatMonthlyPrice(item.pricePerMonth)}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {t('perMonth')}
                          </span>
                        </div>
                        {item.pricePerHour && (
                          <p className="text-sm text-muted-foreground mt-2">
                            <span className="text-foreground font-medium">${formatPrice(item.pricePerHour)}</span> {t('perGpuHour')}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {t('contractType')}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Spacer */}
                  <div className="flex-1" />

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
                    {item.isContactSales || item.pricePerHour === null
                      ? t('contactSales')
                      : t('rentNow')}
                  </HardLink>

                  {/* Corner glow accent */}
                  <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-xl" />
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Volume Discount Note */}
        <ScrollReveal delay={400}>
          <div className="mt-10 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/20 bg-accent/5">
              <span className="w-2 h-2 rounded-full bg-accent" />
              <p className="text-sm text-muted-foreground">
                <span className="text-accent font-medium">
                  {t('volumeDiscount')}
                </span>{' '}
                {t('volumeDiscountNote')}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
