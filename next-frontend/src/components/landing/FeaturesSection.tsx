import { getTranslations } from 'next-intl/server';
import { DocumentCheckIcon, CpuIcon } from '@/components/icons';
import { ComponentType, SVGProps } from 'react';
import { validateTitleDescription } from '@/lib/validation';

// Icons for each feature
const featureIcons: ComponentType<SVGProps<SVGSVGElement>>[] = [
  DocumentCheckIcon, // Dedicated GPUs with SLA
  CpuIcon,           // Managed Service
];

export async function FeaturesSection() {
  const t = await getTranslations('features');
  const features = validateTitleDescription(t.raw('items'));

  return (
    <section id="features" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <div className="scroll-reveal text-center mb-12">
          <span className="inline-flex items-center justify-center rounded-full border border-accent/50 bg-transparent px-4 py-1.5 text-sm font-medium text-white mb-4">
            {t('badge')}
          </span>
          <h2 className="text-2xl md:text-3xl font-bold mb-4 font-heading">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Two Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 max-w-4xl mx-auto">
          {features.map((feature, index) => {
            const Icon = featureIcons[index];

            return (
              <div
                key={feature.title}
                className="scroll-reveal"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div
                  className="
                    group relative overflow-hidden rounded-xl border border-border
                    bg-card/30 backdrop-blur-sm
                    transition-all duration-300 ease-out
                    hover:border-accent/40 hover:-translate-y-1
                    hover:shadow-[0_0_30px_rgba(255,76,0,0.15)]
                    p-6 md:p-8
                    h-full min-h-[200px]
                  "
                >
                  {/* Grid pattern overlay on hover */}
                  <div className="card-grid-pattern absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500" />

                  {/* Glow effect on hover */}
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-accent/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className="
                        w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4
                        transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110
                      "
                    >
                      {Icon ? (
                        <Icon
                          className="w-6 h-6 text-accent transition-transform duration-300 group-hover:scale-110"
                        />
                      ) : (
                        <span className="font-bold text-accent text-xl">
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className="text-xl font-semibold text-foreground mb-3 transition-colors duration-300 group-hover:text-white"
                    >
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
                      {feature.description}
                    </p>
                  </div>

                  {/* Corner accent */}
                  <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </div>
              </div>
            );
          })}
        </div>

        {/* SLA Footnote */}
        <p className="scroll-reveal mt-8 text-xs text-muted-foreground text-center max-w-3xl mx-auto" style={{ animationDelay: '300ms' }}>
          {t('slaFootnote')}
        </p>
      </div>
    </section>
  );
}
