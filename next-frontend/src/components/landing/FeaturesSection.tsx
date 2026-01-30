import { getTranslations } from 'next-intl/server';
import {
  ChartBarIcon,
  ShieldCheckIcon,
  RocketIcon,
  EyeIcon,
  DocumentCheckIcon,
  ScaleIcon,
} from '@/components/icons';
import { ComponentType, SVGProps } from 'react';
import { validateTitleDescription } from '@/lib/validation';

// Icons for each feature
const featureIcons: ComponentType<SVGProps<SVGSVGElement>>[] = [
  ChartBarIcon,    // Understand economics
  ShieldCheckIcon, // Reduce risk
  RocketIcon,      // Launch without surprises
  EyeIcon,         // Operate with clarity
  DocumentCheckIcon, // GPU Services SLA
  ScaleIcon,       // Scale when needed
];

// Bento grid layout configuration
// Format: [colSpan, rowSpan] for md+ screens
const gridConfig = [
  { col: 'md:col-span-2', row: '', size: 'large' },      // Card 1: Large
  { col: '', row: '', size: 'small' },                    // Card 2: Small
  { col: '', row: '', size: 'small' },                    // Card 3: Small
  { col: '', row: '', size: 'small' },                    // Card 4: Small
  { col: '', row: '', size: 'small' },                    // Card 5: Small
  { col: 'md:col-span-2', row: '', size: 'large' },      // Card 6: Large
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
          <h2 className="text-2xl md:text-3xl font-bold mb-4">{t('title')}</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {t('subtitle')}
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-5 max-w-5xl mx-auto">
          {features.map((feature, index) => {
            const Icon = featureIcons[index];
            const config = gridConfig[index] || { col: '', row: '', size: 'small' };
            const isLarge = config.size === 'large';

            return (
              <div
                key={index}
                className={`scroll-reveal ${config.col} ${config.row}`}
                style={{ animationDelay: `${index * 75}ms` }}
              >
                <div
                  className={`
                    group relative overflow-hidden rounded-xl border border-border
                    bg-card/30 backdrop-blur-sm
                    transition-all duration-300 ease-out
                    hover:border-accent/40 hover:-translate-y-1
                    hover:shadow-[0_0_30px_rgba(255,76,0,0.15)]
                    ${isLarge ? 'p-6 md:p-8' : 'p-5 md:p-6'}
                    h-full min-h-[180px]
                  `}
                >
                  {/* Grid pattern overlay on hover */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500"
                    style={{
                      backgroundImage: `linear-gradient(90deg, #FF4C00 1px, transparent 1px),
                                        linear-gradient(180deg, #FF4C00 1px, transparent 1px)`,
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Glow effect on hover */}
                  <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-accent/20 via-transparent to-accent/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Icon */}
                    <div
                      className={`
                        rounded-lg bg-accent/10 flex items-center justify-center mb-4
                        transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110
                        ${isLarge ? 'w-12 h-12' : 'w-10 h-10'}
                      `}
                    >
                      {Icon ? (
                        <Icon
                          className={`text-accent transition-transform duration-300 group-hover:scale-110 ${
                            isLarge ? 'w-6 h-6' : 'w-5 h-5'
                          }`}
                        />
                      ) : (
                        <span className={`font-bold text-accent ${isLarge ? 'text-xl' : 'text-lg'}`}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3
                      className={`font-semibold text-foreground mb-2 transition-colors duration-300 group-hover:text-white ${
                        isLarge ? 'text-xl' : 'text-lg'
                      }`}
                    >
                      {feature.title}
                    </h3>

                    {/* Description */}
                    <p
                      className={`text-muted-foreground leading-relaxed ${
                        isLarge ? 'text-sm md:text-base' : 'text-sm'
                      }`}
                    >
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
        <p className="scroll-reveal mt-8 text-xs text-muted-foreground text-center max-w-3xl mx-auto" style={{ animationDelay: '500ms' }}>
          {t('slaFootnote')}
        </p>
      </div>
    </section>
  );
}
