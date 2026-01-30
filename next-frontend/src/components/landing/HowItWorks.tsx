'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';

interface Step {
  title: string;
  description: string;
}

export function HowItWorks() {
  const t = useTranslations('howItWorks');
  const steps = t.raw('steps') as Step[];

  return (
    <section id="how-it-works" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <ScrollReveal>
          <div className="text-center mb-16">
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

        {/* Vertical Timeline */}
        <div className="relative max-w-3xl mx-auto">
          {/* Central timeline line */}
          <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px md:-translate-x-px">
            <div className="h-full w-full bg-gradient-to-b from-accent/50 via-accent/30 to-accent/10" />
          </div>

          {/* Timeline Steps */}
          <div className="space-y-8 md:space-y-12">
            {steps.map((step, index) => {
              const isEven = index % 2 === 0;

              return (
                <ScrollReveal key={index} delay={index * 75}>
                  <div
                    className={`
                      relative flex items-start gap-6
                      md:gap-8
                      ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}
                    `}
                  >
                    {/* Step number circle - centered on the line */}
                    <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 z-10">
                      <div className="relative group">
                        {/* Glow effect */}
                        <div className="absolute inset-0 rounded-full bg-accent/40 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        {/* Number circle */}
                        <div
                          className="
                            relative w-8 h-8 rounded-full
                            bg-background border-2 border-accent
                            flex items-center justify-center
                            text-sm font-bold text-accent
                            transition-all duration-300
                            group-hover:bg-accent group-hover:text-white
                            group-hover:shadow-[0_0_20px_rgba(255,76,0,0.5)]
                          "
                        >
                          {index + 1}
                        </div>
                      </div>
                    </div>

                    {/* Spacer for mobile */}
                    <div className="w-8 md:hidden flex-shrink-0" />

                    {/* Content Card */}
                    <div
                      className={`
                        flex-1
                        md:w-[calc(50%-2rem)]
                        ${isEven ? 'md:pr-8' : 'md:pl-8'}
                      `}
                    >
                      <div className="group relative">
                        {/* Card glow on hover */}
                        <div
                          className="absolute -inset-[1px] rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
                          style={{
                            background: `linear-gradient(135deg,
                              rgba(255,76,0,0.3) 0%,
                              rgba(255,76,0,0.1) 50%,
                              rgba(255,76,0,0.3) 100%)`,
                          }}
                        />

                        {/* Card content */}
                        <div
                          className="
                            relative rounded-xl border border-border bg-card/30 backdrop-blur-sm
                            p-5 md:p-6
                            transition-all duration-300 ease-out
                            group-hover:border-accent/40 group-hover:-translate-y-1
                            group-hover:shadow-[0_0_30px_rgba(255,76,0,0.1)]
                          "
                        >
                          {/* Grid pattern overlay */}
                          <div
                            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-[0.02] transition-opacity duration-500 overflow-hidden"
                            style={{
                              backgroundImage: `linear-gradient(90deg, #FF4C00 1px, transparent 1px),
                                                linear-gradient(180deg, #FF4C00 1px, transparent 1px)`,
                              backgroundSize: '20px 20px',
                            }}
                          />

                          {/* Content */}
                          <div className="relative z-10">
                            <h3 className="text-lg font-semibold text-foreground mb-2 transition-colors duration-300 group-hover:text-white">
                              {step.title}
                            </h3>
                            <p className="text-muted-foreground text-sm leading-relaxed">
                              {step.description}
                            </p>
                          </div>

                          {/* Corner glow */}
                          <div
                            className={`
                              absolute top-0 w-16 h-16 bg-gradient-to-br from-accent/10 to-transparent
                              opacity-0 group-hover:opacity-100 transition-opacity duration-500
                              ${isEven ? 'right-0 rounded-tr-xl bg-gradient-to-bl' : 'left-0 rounded-tl-xl'}
                            `}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Empty space for alternating layout on desktop */}
                    <div className="hidden md:block md:w-[calc(50%-2rem)]" />
                  </div>
                </ScrollReveal>
              );
            })}
          </div>

          {/* Timeline end dot */}
          <div className="absolute left-4 md:left-1/2 md:-translate-x-1/2 -bottom-4">
            <div className="w-3 h-3 rounded-full bg-accent/50 animate-pulse" />
          </div>
        </div>

        {/* Billing Note */}
        <ScrollReveal delay={400}>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-accent/20 bg-accent/5">
              <svg
                className="w-4 h-4 text-accent flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-muted-foreground">
                <span className="text-accent font-medium">{t('noteLabel')}</span> {t('note')}
              </p>
            </div>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
