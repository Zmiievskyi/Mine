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
            <span className="inline-flex items-center justify-center rounded-full border border-[#FF4C00]/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
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
              <div className="rounded-xl border border-border bg-card/30 p-6 flex flex-col h-full">
                <div className="mb-6">
                  <h3 className="text-xl font-bold text-foreground mb-2">
                    {item.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {item.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <CheckIcon className="w-4 h-4 flex-shrink-0 text-accent" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className="mb-6">
                  {item.isContactSales || item.pricePerHour === null ? (
                    <span className="text-xl font-bold text-foreground">
                      {t('customPricing')}
                    </span>
                  ) : (
                    <div className="flex flex-col">
                      <div>
                        <span className="text-3xl font-bold text-foreground">
                          ${formatPrice(item.pricePerHour)}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {' '}
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

                {/* Rent GPU Button */}
                <button
                  type="button"
                  className="w-full py-3 px-4 bg-accent hover:bg-accent-hover text-white font-semibold text-sm rounded-lg transition-colors duration-200"
                  onClick={() => openModal(item.name)}
                >
                  {item.isContactSales || item.pricePerHour === null
                    ? t('contactSales')
                    : t('rentNow')}
                </button>
              </div>
            </ScrollReveal>
          ))}
        </div>

        {/* Volume Discount Note */}
        <ScrollReveal delay={400}>
          <div className="mt-8 text-center">
            <p className="text-sm text-muted-foreground">
              <span className="text-accent font-medium">
                {t('volumeDiscount')}
              </span>{' '}
              {t('volumeDiscountNote')}
            </p>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
