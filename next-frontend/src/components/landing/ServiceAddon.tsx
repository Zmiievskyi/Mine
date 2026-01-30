'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface AddonItem {
  title: string;
  description: string;
}

export function ServiceAddon() {
  const t = useTranslations('serviceAddon');
  const items = t.raw('items') as AddonItem[];

  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        <ScrollReveal>
          {/* Section Title */}
          <h3 className="text-lg md:text-xl font-semibold text-center mb-6 text-muted-foreground">
            {t('sectionTitle')}
          </h3>

          {/* Addon Band */}
          <div className="group relative max-w-4xl mx-auto">
            {/* Outer glow on hover */}
            <div
              className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
              style={{
                background: `linear-gradient(135deg,
                  rgba(255,76,0,0.3) 0%,
                  rgba(255,76,0,0.1) 50%,
                  rgba(255,76,0,0.3) 100%)`,
              }}
            />

            {/* Card */}
            <div
              className="
                relative rounded-xl border border-border bg-card/30 backdrop-blur-sm
                p-6 md:p-8
                transition-all duration-300 ease-out
                group-hover:border-accent/40
                group-hover:shadow-[0_0_40px_rgba(255,76,0,0.1)]
              "
            >
              {/* Grid pattern overlay */}
              <div
                className="absolute inset-0 rounded-xl opacity-[0.015] overflow-hidden"
                style={{
                  backgroundImage: `linear-gradient(90deg, #FF4C00 1px, transparent 1px),
                                    linear-gradient(180deg, #FF4C00 1px, transparent 1px)`,
                  backgroundSize: '32px 32px',
                }}
              />

              {/* Header row */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <h4 className="text-xl font-bold text-foreground">
                  {t('title')}
                </h4>
                <span className="inline-flex items-center justify-center rounded-full border border-accent/50 bg-accent/10 px-4 py-1.5 text-xs font-medium text-accent uppercase tracking-wide">
                  {t('badge')}
                </span>
              </div>

              {/* Items list */}
              <ul className="relative z-10 space-y-4 mb-6">
                {items.map((item, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 group/item"
                  >
                    {/* Orange bullet */}
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-accent mt-2 transition-transform duration-300 group-hover/item:scale-125" />
                    <span className="text-sm text-muted-foreground leading-relaxed">
                      <strong className="text-foreground font-medium">
                        {item.title}:
                      </strong>{' '}
                      {item.description}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Footnote */}
              <div className="relative z-10 pt-4 border-t border-border/50">
                <p className="text-xs text-muted-foreground/70 italic">
                  {t('note')}
                </p>
              </div>

              {/* Dashed border accent (left side) */}
              <div
                className="absolute left-0 top-6 bottom-6 w-px opacity-30"
                style={{
                  background: `repeating-linear-gradient(
                    180deg,
                    #FF4C00 0px,
                    #FF4C00 4px,
                    transparent 4px,
                    transparent 8px
                  )`,
                }}
              />
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
