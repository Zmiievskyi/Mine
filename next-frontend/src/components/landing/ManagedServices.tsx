import { getTranslations } from 'next-intl/server';
import Image from 'next/image';
import {
  UploadIcon,
  DatabaseIcon,
  MonitorIcon,
  FilterIcon,
  ChartBarIcon,
  CpuIcon,
  RefreshIcon,
} from '@/components/icons';
import { ComponentType, SVGProps } from 'react';
import { validateTitleDescription } from '@/lib/validation';

const serviceIcons: ComponentType<SVGProps<SVGSVGElement>>[] = [
  UploadIcon,
  DatabaseIcon,
  MonitorIcon,
  FilterIcon,
  ChartBarIcon,
  CpuIcon,
  RefreshIcon,
];

export async function ManagedServices() {
  const t = await getTranslations('managedServices');
  const services = validateTitleDescription(t.raw('services'));

  return (
    <section id="managed" className="py-16 md:py-24">
      <div className="mx-auto w-full max-w-screen-xl px-4 md:px-12 lg:px-20">
        {/* Section Header */}
        <div className="scroll-reveal text-center mb-12">
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

        {/* Services Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => {
            const Icon = serviceIcons[index];
            if (!Icon) return null;
            const isWide = index === 6; // Last item (Updates & Patches) is wide
            return (
              <div
                key={service.title}
                className={`scroll-reveal ${isWide ? 'col-span-2' : ''}`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="rounded-xl border border-border bg-card/30 p-5 hover:bg-card/50 transition-colors h-full">
                  <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 text-accent" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    {service.title}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {service.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Dashboard Preview */}
        <div className="scroll-reveal mt-12 md:mt-16" style={{ animationDelay: '400ms' }}>
          <div className="relative group">
            {/* Glow effect behind the dashboard */}
            <div className="absolute -inset-1 bg-gradient-to-r from-accent/20 via-accent/10 to-accent/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700" />

            {/* Dashboard container */}
            <div className="relative rounded-xl border border-border bg-card/30 backdrop-blur-sm p-4 md:p-6 overflow-hidden">
              {/* Header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ChartBarIcon className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    {t('dashboardTitle')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('dashboardSubtitle')}
                  </p>
                </div>
                {/* Live indicator */}
                <div className="ml-auto flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  <span className="text-xs text-green-500 font-medium">Live</span>
                </div>
              </div>

              {/* Dashboard screenshot */}
              <div className="relative rounded-lg overflow-hidden border border-border/50">
                <Image
                  src="/dashboard1.png"
                  alt={t('dashboardAlt')}
                  width={1568}
                  height={600}
                  className="w-full h-auto"
                  priority={false}
                />
                {/* Subtle overlay gradient at edges */}
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-background/20 via-transparent to-transparent" />
              </div>

              {/* Caption */}
              <p className="mt-4 text-xs text-muted-foreground text-center">
                {t('dashboardCaption')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
