import { getTranslations } from 'next-intl/server';
import { ServerIcon, CpuIcon } from '@/components/icons';
import { ComponentType, SVGProps } from 'react';

interface AudienceCard {
  title: string;
  description: string;
  points: string[];
}

function validateStringArray(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === 'string');
}

const audienceIcons: ComponentType<SVGProps<SVGSVGElement>>[] = [
  ServerIcon, // Large-Scale Operators
  CpuIcon,    // Pools and Resellers
];

export async function ForWho() {
  const t = await getTranslations('forWho');

  const audiences: AudienceCard[] = [
    {
      title: t('operators.title'),
      description: t('operators.description'),
      points: validateStringArray(t.raw('operators.points')),
    },
    {
      title: t('pools.title'),
      description: t('pools.description'),
      points: validateStringArray(t.raw('pools.points')),
    },
  ];

  return (
    <section id="for-who" className="py-16 md:py-24">
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

        {/* Audience Cards with Glowing Effect */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {audiences.map((audience, index) => {
            const Icon = audienceIcons[index];
            if (!Icon) return null;

            return (
              <div
                key={audience.title}
                className="scroll-reveal"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                {/* Glowing Card Container */}
                <div className="group relative h-full">
                  {/* Animated glow border */}
                  <div className="for-who-glow absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />

                  {/* Card content */}
                  <div
                    className="
                      relative rounded-xl border border-border bg-card/30 backdrop-blur-sm
                      p-6 md:p-8 h-full
                      transition-all duration-300 ease-out
                      group-hover:border-accent/30 group-hover:-translate-y-1
                      group-hover:shadow-[0_0_40px_rgba(255,76,0,0.15)]
                    "
                  >
                    {/* Grid pattern overlay */}
                    <div className="for-who-grid absolute inset-0 rounded-xl opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 overflow-hidden" />

                    {/* Content */}
                    <div className="relative z-10">
                      {/* Icon */}
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-5 transition-all duration-300 group-hover:bg-accent/20 group-hover:scale-110">
                        <Icon className="w-6 h-6 text-accent" />
                      </div>

                      {/* Title */}
                      <h3 className="text-xl font-semibold text-foreground mb-2 transition-colors duration-300 group-hover:text-white">
                        {audience.title}
                      </h3>

                      {/* Description */}
                      <p className="text-muted-foreground text-sm mb-5">
                        {audience.description}
                      </p>

                      {/* Points list */}
                      <ul className="space-y-3" role="list">
                        {audience.points.map((point) => (
                          <li
                            key={`${audience.title}-${point.slice(0, 20)}`}
                            className="flex items-start gap-3 group/item"
                          >
                            {/* Animated checkmark */}
                            <span
                              className="
                                flex-shrink-0 w-5 h-5 rounded-full
                                bg-accent/10 group-hover:bg-accent/20
                                flex items-center justify-center mt-0.5
                                transition-all duration-300
                                group-hover/item:scale-110
                              "
                            >
                              <svg
                                aria-hidden="true"
                                className="w-3 h-3 text-accent transition-transform duration-300 group-hover/item:scale-110"
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
                            <span className="text-sm text-muted-foreground group-hover/item:text-foreground transition-colors duration-300">
                              {point}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Corner glow accent */}
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-accent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-tr-xl" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
