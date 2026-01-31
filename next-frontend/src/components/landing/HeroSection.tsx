'use client';

import { useTranslations } from 'next-intl';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useHubspot } from '@/lib/contexts/HubspotContext';

export function HeroSection() {
  const t = useTranslations('hero');
  const { openModal } = useHubspot();

  return (
    <section id="home" className="py-12 sm:py-16 md:py-32">
      <div className="mx-auto max-w-xl md:max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 md:grid-cols-2 md:gap-12 lg:grid-cols-5 lg:gap-24">
          {/* Left Column: Text Content */}
          <ScrollReveal className="lg:col-span-2">
            <div className="md:pr-6 lg:pr-0">
              {/* Animated Badge */}
              <button className="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200 mb-6">
                <span className="badge-spark" />
                <span className="badge-backdrop" />
                <span className="relative z-10 py-0.5 text-sm text-neutral-100 flex items-center justify-center gap-1">
                  <span>✨</span>
                  {t('badge')}
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4 ml-1 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </span>
              </button>

              {/* Heading */}
              <h1 className="text-4xl font-semibold lg:text-5xl leading-[1.1] mb-6">
                {t('title')}{' '}
                <span className="bg-gradient-to-r from-[#FF4C00] to-[#FF7A45] bg-clip-text text-transparent">
                  {t('titleHighlight')}
                </span>{' '}
                {t('titleSuffix')}
              </h1>

            </div>

            {/* CTA Buttons */}
            <ScrollReveal delay={100}>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:px-8 py-2.5 bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-md transition-colors duration-200 shadow-lg shadow-accent/25"
                  onClick={() => openModal()}
                >
                  {t('cta')}
                  <svg
                    aria-hidden="true"
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </button>
                <a
                  href="#pricing"
                  className="inline-flex items-center justify-center gap-2 w-full sm:w-auto sm:px-8 py-2.5 border border-border hover:border-accent/50 text-foreground hover:text-white font-medium text-sm rounded-md transition-colors duration-200"
                >
                  {t('ctaSecondary')}
                </a>
              </div>
            </ScrollReveal>
          </ScrollReveal>

          {/* Right Column: What you get panel */}
          <ScrollReveal delay={150} className="lg:col-span-3">
            <aside className="rounded-2xl border border-border bg-zinc-900/40 p-6 md:p-8">
              {/* Three pains card */}
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-5">
                  {t('panel.painsTitle')}
                </h3>

                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">
                        {t('panel.pains.silence.title')}
                      </strong>{' '}
                      {t('panel.pains.silence.description')}
                    </p>
                  </li>
                  <li className="border-t border-dashed border-border/50 pt-4 flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">
                        {t('panel.pains.opaque.title')}
                      </strong>{' '}
                      {t('panel.pains.opaque.description')}
                    </p>
                  </li>
                  <li className="border-t border-dashed border-border/50 pt-4 flex items-start gap-3">
                    <span className="mt-1.5 w-2 h-2 rounded-full bg-accent flex-shrink-0" />
                    <p className="text-muted-foreground">
                      <strong className="text-foreground">
                        {t('panel.pains.blind.title')}
                      </strong>{' '}
                      {t('panel.pains.blind.description')}
                    </p>
                  </li>
                </ul>
              </div>
            </aside>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
