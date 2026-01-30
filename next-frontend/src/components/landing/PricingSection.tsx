'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { CheckIcon } from '@/components/icons';
import { pricing, formatPrice, formatMonthlyPrice } from '@/data/pricing';
import { useHubspot } from '@/lib/contexts/HubspotContext';

export function PricingSection() {
  const { openModal } = useHubspot();
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
                    <p className="text-sm text-muted-foreground mt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Price Display */}
                  <div className="relative z-10 mb-5">
                    {item.isContactSales || item.pricePerHour === null ? (
                      <span className="text-xl font-bold text-foreground">
                        {t('customPricing')}
                      </span>
                    ) : (
                      <div className="flex flex-col">
                        <div className="flex items-baseline gap-1">
                          <span className="text-3xl font-bold text-white transition-all duration-300 group-hover:text-accent">
                            ${formatPrice(item.pricePerHour)}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {t('perHour')}
                          </span>
                        </div>
                        {item.pricePerMonth && (
                          <span className="text-sm text-muted-foreground mt-1">
                            ${formatMonthlyPrice(item.pricePerMonth)}{t('perMonth')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Features List */}
                  <ul className="relative z-10 space-y-3 mb-6 flex-1">
                    {item.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 group/item"
                      >
                        <span
                          className="
                            flex-shrink-0 w-5 h-5 rounded-full
                            bg-accent/10 group-hover:bg-accent/20
                            flex items-center justify-center mt-0.5
                            transition-all duration-300
                            group-hover/item:scale-110
                          "
                        >
                          <CheckIcon className="w-3 h-3 text-accent" />
                        </span>
                        <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors duration-300">
                          {feature}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <button
                    type="button"
                    className="
                      relative z-10 w-full py-3 px-4
                      bg-accent/90 hover:bg-accent
                      text-white font-semibold text-sm rounded-lg
                      transition-all duration-300
                      group-hover:shadow-[0_0_20px_rgba(255,76,0,0.4)]
                    "
                    onClick={() => openModal(item.name)}
                  >
                    {item.isContactSales || item.pricePerHour === null
                      ? t('contactSales')
                      : t('rentNow')}
                  </button>

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
